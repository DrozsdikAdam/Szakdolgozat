package hu.mes.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import hu.mes.backend.dtos.inventory.InventoryResponse;
import hu.mes.backend.dtos.inventory.InventoryUpdateRequest;
import hu.mes.backend.services.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/")
    public ResponseEntity<List<InventoryResponse>> getAllInventoryItems() {
        List<InventoryResponse> response = inventoryService.getAllInventories();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<InventoryResponse> getInventoryByProductId(
            @PathVariable UUID productId) {
        InventoryResponse response = inventoryService.getInventoryByProductId(productId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/adjust")
    public ResponseEntity<InventoryResponse> adjustStock(
            @Valid @RequestBody InventoryUpdateRequest request) {
        InventoryResponse response = inventoryService.adjustStock(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/reserve")
    public ResponseEntity<InventoryResponse> reserveStock(
            @Valid @RequestBody InventoryUpdateRequest request) {
        InventoryResponse response = inventoryService.reserveStock(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/consume")
    public ResponseEntity<InventoryResponse> consumeStock(
            @Valid @RequestBody InventoryUpdateRequest request) {
        InventoryResponse response = inventoryService.consumeReservedStock(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/release")
    public ResponseEntity<InventoryResponse> releaseStock(
            @Valid @RequestBody InventoryUpdateRequest request) {
        InventoryResponse response = inventoryService.releaseReservedStock(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

}
