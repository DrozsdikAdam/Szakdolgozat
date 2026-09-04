package hu.mes.backend.security;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;

import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.services.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ControllerAdvice
@RequiredArgsConstructor
public class XssSanitizerAdvice extends RequestBodyAdviceAdapter {

    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public boolean supports(MethodParameter methodParameter, Type targetType,
            Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public HttpInputMessage beforeBodyRead(HttpInputMessage inputMessage, MethodParameter parameter, Type targetType,
            Class<? extends HttpMessageConverter<?>> converterType) throws IOException {

        InputStream rawStream = inputMessage.getBody();
        if (rawStream == null)
            return inputMessage;

        byte[] bytes = rawStream.readAllBytes();
        if (bytes.length == 0)
            return inputMessage;

        try {
            JsonNode rootNode = objectMapper.readTree(bytes);
            checkNode(rootNode, null);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            // Ha nem JSON formátumú a test, engedjük tovább a standard hibakezelőhöz
        }

        return new HttpInputMessage() {
            @Override
            public InputStream getBody() {
                return new ByteArrayInputStream(bytes);
            }

            @Override
            public HttpHeaders getHeaders() {
                return inputMessage.getHeaders();
            }
        };
    }

    private void checkNode(JsonNode node, String fieldName) {
        if (node.isObject()) {
            node.properties().forEach(entry -> checkNode(entry.getValue(), entry.getKey()));
        } else if (node.isArray()) {
            node.elements().forEachRemaining(element -> checkNode(element, fieldName));
        } else if (node.isTextual()) {
            String value = node.asText().toLowerCase();
            if (value.contains("<script")
                    || value.contains("<iframe")
                    || value.contains("<svg")
                    || value.contains("<body")
                    || value.contains("<noscript")
                    || value.contains("<applet")
                    || value.contains("<object")
                    || value.contains("javascript:")
                    || value.contains("onerror=")
                    || value.contains("onload=")) {

                log.warn("XSS támadási kísérlet észlelve! Mező: [{}], Gyanús tartalom: [{}]", fieldName, value);
                String safeValue = value.length() > 200 ? value.substring(0, 200) + "..." : value;

                auditLogService.log(AuditAction.SECURITY_VIOLATION, AuditEntityType.SECURITY, fieldName,
                        "XSS támadási kísérlet észlelve a mezőben: " + fieldName + ", érték: " + safeValue);

                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lehetéges XSS támadást észleltünk!");
            }
        }
    }
}
