/*
================================================================
Ez a fájl mesterséges intelligencia segítségével íródott. 
================================================================
*/
package hu.mes.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import hu.mes.backend.dtos.bom.BOMItemRequest;
import hu.mes.backend.dtos.bom.BOMResponse;
import hu.mes.backend.dtos.bom.BOMTreeNode;
import hu.mes.backend.mappers.BOMMapper;
import hu.mes.backend.models.BOMItem;
import hu.mes.backend.models.Product;
import hu.mes.backend.models.enums.AuditAction;
import hu.mes.backend.models.enums.AuditEntityType;
import hu.mes.backend.repositories.BOMItemRepository;

@ExtendWith(MockitoExtension.class)
public class BOMServiceTest {

	@InjectMocks
	private BOMService bomService;

	@Mock
	private BOMItemRepository bomRepository;

	@Mock
	private ProductService productService;

	@Mock
	private BOMMapper bomMapper;

	@Mock
	private AuditLogService auditLogService;

	private Product parentProduct;
	private Product componentProduct;
	private UUID parentId;
	private UUID compId;

	@BeforeEach
	void setUp() {
		parentId = UUID.randomUUID();
		compId = UUID.randomUUID();

		parentProduct = Product.builder()
				.name("Késztermék A")
				.sku("KT-001")
				.unit("db")
				.active(true)
				.build();
		parentProduct.setId(parentId);

		componentProduct = Product.builder()
				.name("Alkatrész B")
				.sku("ALK-001")
				.unit("db")
				.active(true)
				.build();
		componentProduct.setId(compId);
	}

	@Test
	void addComponentToBOM_Success() {
		BOMItemRequest request = new BOMItemRequest();
		request.setParentProductId(parentId);
		request.setComponentProductId(compId);
		request.setQuantity(BigDecimal.valueOf(4));

		when(productService.getProductEntityById(parentId)).thenReturn(parentProduct);
		when(productService.getProductEntityById(compId)).thenReturn(componentProduct);
		when(bomRepository.findByParentProductIdAndComponentProductId(parentId, compId))
				.thenReturn(Optional.empty());
		when(bomRepository.findByParentProductId(compId)).thenReturn(Collections.emptyList());

		BOMItem savedItem = BOMItem.builder()
				.parentProduct(parentProduct)
				.componentProduct(componentProduct)
				.quantity(BigDecimal.valueOf(4))
				.active(true)
				.build();

		BOMResponse expectedResponse = new BOMResponse();
		when(bomRepository.save(any(BOMItem.class))).thenReturn(savedItem);
		when(bomMapper.convertToResponse(savedItem)).thenReturn(expectedResponse);

		BOMResponse result = bomService.addComponentToBOM(request);

		assertNotNull(result);
		verify(bomRepository).save(any(BOMItem.class));
		verify(auditLogService).log(eq(AuditAction.CREATE), eq(AuditEntityType.BOM), eq("KT-001"), any());
	}

	@Test
	void addComponentToBOM_SameProduct_ThrowsIllegalArgumentException() {
		BOMItemRequest request = new BOMItemRequest();
		request.setParentProductId(parentId);
		request.setComponentProductId(parentId);

		when(productService.getProductEntityById(parentId)).thenReturn(parentProduct);

		IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
				() -> bomService.addComponentToBOM(request));
		assertEquals("A szülő és a komponens nem lehet ugyanaz.", ex.getMessage());

		verify(bomRepository, never()).save(any());
	}

	@Test
	void addComponentToBOM_AlreadyExists_ThrowsIllegalArgumentException() {
		BOMItemRequest request = new BOMItemRequest();
		request.setParentProductId(parentId);
		request.setComponentProductId(compId);

		when(productService.getProductEntityById(parentId)).thenReturn(parentProduct);
		when(productService.getProductEntityById(compId)).thenReturn(componentProduct);

		BOMItem existingItem = BOMItem.builder().build();
		when(bomRepository.findByParentProductIdAndComponentProductId(parentId, compId))
				.thenReturn(Optional.of(existingItem));

		IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
				() -> bomService.addComponentToBOM(request));
		assertEquals("Ez a komponens már hozzá van adva a listához!", ex.getMessage());

		verify(bomRepository, never()).save(any());
	}

	@Test
	void addComponentToBOM_CyclicDependency_ThrowsIllegalArgumentException() {
		BOMItemRequest request = new BOMItemRequest();
		request.setParentProductId(parentId);
		request.setComponentProductId(compId);

		when(productService.getProductEntityById(parentId)).thenReturn(parentProduct);
		when(productService.getProductEntityById(compId)).thenReturn(componentProduct);
		when(bomRepository.findByParentProductIdAndComponentProductId(parentId, compId))
				.thenReturn(Optional.empty());

		// A komponens alatt van egy BOM elem, aminek a komponense a szülő termék
		// (körkörös hivatkozás)
		BOMItem cyclicItem = BOMItem.builder()
				.parentProduct(componentProduct)
				.componentProduct(parentProduct)
				.active(true)
				.build();
		when(bomRepository.findByParentProductId(compId)).thenReturn(List.of(cyclicItem));

		IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
				() -> bomService.addComponentToBOM(request));
		assertEquals("Ciklikus függőség!", ex.getMessage());

		verify(bomRepository, never()).save(any());
	}

	@Test
	void getBOMTree_WithoutMultiplier_DefaultsToOneAndBuildsTree() {
		when(productService.getProductEntityById(parentId)).thenReturn(parentProduct);
		when(productService.getProductEntityById(compId)).thenReturn(componentProduct);

		BOMItem item = BOMItem.builder()
				.parentProduct(parentProduct)
				.componentProduct(componentProduct)
				.quantity(BigDecimal.valueOf(2))
				.active(true)
				.build();

		// Mind az ellenőrző fa bejárás, mind a faépítés lekéri a parent alkatrészeit
		when(bomRepository.findByParentProductId(parentId)).thenReturn(List.of(item));
		when(bomRepository.findByParentProductId(compId)).thenReturn(Collections.emptyList());

		BOMTreeNode root = bomService.getBOMTree(parentId, null);

		assertNotNull(root);
		assertEquals(parentId, root.getProductId());
		assertEquals("Késztermék A", root.getProductName());
		assertEquals(BigDecimal.ONE, root.getQuantity());
		assertEquals(1, root.getChildren().size());

		BOMTreeNode childNode = root.getChildren().get(0);
		assertEquals(compId, childNode.getProductId());
		assertEquals("Alkatrész B", childNode.getProductName());
		assertEquals(BigDecimal.valueOf(2), childNode.getQuantity());
	}

	@Test
	void getBOMTree_CyclicDependencyInTree_ThrowsIllegalArgumentException() {
		when(productService.getProductEntityById(parentId)).thenReturn(parentProduct);

		// Körkörös függőség a fában: parent -> comp -> parent
		BOMItem item1 = BOMItem.builder()
				.parentProduct(parentProduct)
				.componentProduct(componentProduct)
				.quantity(BigDecimal.valueOf(2))
				.active(true)
				.build();

		BOMItem item2 = BOMItem.builder()
				.parentProduct(componentProduct)
				.componentProduct(parentProduct)
				.quantity(BigDecimal.valueOf(1))
				.active(true)
				.build();

		when(bomRepository.findByParentProductId(parentId)).thenReturn(List.of(item1));
		when(bomRepository.findByParentProductId(compId)).thenReturn(List.of(item2));

		assertThrows(IllegalArgumentException.class, () -> bomService.getBOMTree(parentId, BigDecimal.ONE));
	}
}
