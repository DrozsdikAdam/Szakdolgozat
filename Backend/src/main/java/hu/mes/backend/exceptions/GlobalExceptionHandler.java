package hu.mes.backend.exceptions;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.validation.FieldError;
import org.springframework.dao.DataIntegrityViolationException;

import jakarta.persistence.EntityNotFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, String>> handleOptimisticLocking(
            ObjectOptimisticLockingFailureException exception) {

        Map<String, String> response = new HashMap<>();
        response.put("message",
                "Adatkonfliktus: A frissíteni kívánt adatok megváltoztak az adatbázisban. Kérem frissítse az oldalt és próbálja újra.");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("error", "Optimistic Locking Failure");

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(
            IllegalArgumentException exception) {

        Map<String, String> response = new HashMap<>();
        response.put("message", exception.getMessage());
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("error", "Invalid Argument");

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleEntityNotFoundException(
            EntityNotFoundException exception) {

        Map<String, String> response = new HashMap<>();
        response.put("message",
                exception.getMessage());
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("error", "Entity Not Found");

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException exception) {

        Map<String, String> response = new HashMap<>();
        for (FieldError error : exception.getBindingResult().getFieldErrors())
            response.put(error.getField(), error.getDefaultMessage());

        response.put("message",
                "A kérésben küldött adatok érvénytelenek. Ellenőrizze a bemeneti értékeket.");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("error", "Validation Error");

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(
            DataIntegrityViolationException exception) {

        Map<String, String> response = new HashMap<>();
        response.put("message", "Adatbázis korlátozási hiba: A megadott cikkszám (SKU) vagy adat már létezik!");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("error", "Data Integrity Violation");

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(
            Exception exception) {

        Map<String, String> response = new HashMap<>();
        String msg = exception.getMessage() != null ? exception.getMessage() : "Váratlan szerveroldali hiba történt.";
        response.put("message", msg);
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("error", "Váratlan hiba");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

}
