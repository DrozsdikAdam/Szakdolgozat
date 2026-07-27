package hu.mes.backend.controllers;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import hu.mes.backend.dtos.bom.BOMItemRequest;
import hu.mes.backend.dtos.bom.BOMResponse;
import hu.mes.backend.dtos.bom.BOMTreeNode;
import hu.mes.backend.services.BOMService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/bom")
@RequiredArgsConstructor
public class BOMController {

    private final BOMService bomService;

    @PostMapping
    public ResponseEntity<BOMResponse> addComponentToBOM(@Valid @RequestBody BOMItemRequest request) {
        BOMResponse response = bomService.addComponentToBOM(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/tree/{parentProductId}")
    public ResponseEntity<BOMTreeNode> getBOMTree(
            @PathVariable UUID parentProductId,
            @RequestParam(required = false) BigDecimal quantity) {
        BOMTreeNode response = bomService.getBOMTree(parentProductId, quantity);
        return ResponseEntity.ok(response);
    }

}
