package hu.mes.backend.config;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import hu.mes.backend.models.BOMItem;
import hu.mes.backend.models.Inventory;
import hu.mes.backend.models.Product;
import hu.mes.backend.models.Role;
import hu.mes.backend.models.User;
import hu.mes.backend.models.WorkOrder;
import hu.mes.backend.models.enums.RolesEnum;
import hu.mes.backend.models.enums.WorkOrderPriority;
import hu.mes.backend.models.enums.WorkOrderStatus;
import hu.mes.backend.repositories.BOMItemRepository;
import hu.mes.backend.repositories.InventoryRepository;
import hu.mes.backend.repositories.ProductRepository;
import hu.mes.backend.repositories.RoleRepository;
import hu.mes.backend.repositories.UserRepository;
import hu.mes.backend.repositories.WorkOrderRepository;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final PasswordEncoder passwordEncoder;
	private final ProductRepository productRepository;
	private final BOMItemRepository bomItemRepository;
	private final WorkOrderRepository workOrderRepository;
	private final InventoryRepository inventoryRepository;

	@Override
	public void run(String... args) throws Exception {
		initRoles();
		initUser();
		initProduct();
		initBOM();
		initInventory();
		initWorkOrder();
		System.out.println(">>> MES Rendszer Tesztadatok sikeresen betöltve!");
	}

	private void initRoles() {
		for (RolesEnum roleEnum : RolesEnum.values()) {
			Optional<Role> roleOpt = roleRepository.findByName(roleEnum);
			if (roleOpt.isEmpty()) {
				Role newRole = new Role();
				newRole.setName(roleEnum);
				newRole.setActive(true);
				roleRepository.save(newRole);
			}
		}
	}

	private void initUser() {
		User[] users = {
				User.builder().name("admin").password("Jelszo123!").email("admin@email.hu")
						.phoneNumber("+36301234567")
						.roles(new HashSet<>(Set.of(roleRepository
								.findByName(RolesEnum.SYSTEMADMIN).get())))
						.build(),
				User.builder().name("Béla").password("Jelszo123!").email("bela@email.hu")
						.phoneNumber("+36301234567")
						.roles(new HashSet<>(Set.of(
								roleRepository.findByName(RolesEnum.OPERATOR).get())))
						.build(),
				User.builder().name("Pista").password("Jelszo123!").email("pista@email.hu")
						.phoneNumber("+36301234567")
						.roles(new HashSet<>(Set.of(
								roleRepository.findByName(RolesEnum.MANAGER).get())))
						.build(),
				User.builder().name("Jani").password("Jelszo123!").email("jani@email.hu")
						.phoneNumber("+36301234567")
						.roles(new HashSet<>(
								Set.of(roleRepository.findByName(RolesEnum.CEO).get())))
						.build(),
				User.builder().name("Feri").password("Jelszo123!").email("feri@email.hu")
						.phoneNumber("+36301234567")
						.roles(new HashSet<>(Set.of(roleRepository
								.findByName(RolesEnum.SYSTEMADMIN).get())))
						.build(),
				User.builder().name("Tomi").password("Jelszo123!").email("tomi@email.hu")
						.phoneNumber("+36301234567")
						.roles(new HashSet<>(Set.of(
								roleRepository.findByName(RolesEnum.OPERATOR).get())))
						.build(),
				User.builder().name("Tibor").password("Jelszo123!").email("tibor@email.hu")
						.phoneNumber("+36301234567")
						.roles(new HashSet<>(Set.of(
								roleRepository.findByName(RolesEnum.MANAGER).get(),
								roleRepository.findByName(RolesEnum.OPERATOR).get())))
						.build(),
		};

		for (User user : users) {
			Optional<User> userOpt = userRepository.findByName(user.getName());
			if (userOpt.isEmpty()) {
				user.setPassword(passwordEncoder.encode(user.getPassword()));
				user.setActive(true);
				userRepository.save(user);
				System.out.println("A(z) " + user.getName() + " felhasználó sikeresen létrehozva.");
			}
		}
	}

	private void initProduct() {
		if (productRepository.count() == 0) {
			Product[] products = {
					Product.builder().name("Üveg alapanyag (Szódamész)").sku("UG-2024")
							.description("Ipari üveggyártási alapanyag").unit("kg")
							.active(true).deleted(false).build(),
					Product.builder().name("Kerámia agyag").sku("KA-2024")
							.description("Hőkezelt finomkerámia massza")
							.unit("kg").active(true).deleted(false).build(),
					Product.builder().name("Szilikon fogantyú").sku("SZ-FOG-01")
							.description("Hőálló szilikon markolat")
							.unit("db").active(true).deleted(false).build(),
					Product.builder().name("Díszcsomagolás (Karton doboz)").sku("DOB-01")
							.description("Védő és ajándék díszdoboz").unit("db")
							.active(true).deleted(false).build(),

					Product.builder().name("Kávés Bögre").sku("KB-2024")
							.description("Prémium kerámia bögre szilikon fogantyúval")
							.unit("db").active(true)
							.deleted(false).build(),
					Product.builder().name("Vizes Pohár").sku("VP-2024")
							.description("3dl-es edzett üveg vizes pohár")
							.unit("db").active(true).deleted(false).build(),
					Product.builder().name("Sörös Pohár").sku("SP-2024")
							.description("0.5L-es vastagfalú söröskorsó")
							.unit("db").active(true).deleted(false).build(),
					Product.builder().name("Boros Pohár").sku("BP-2024")
							.description("4.5dl-es kristály borospohár")
							.unit("db").active(true).deleted(false).build(),
					Product.builder().name("Pálinkás Pohár").sku("PP-2024")
							.description("5cl-es talpas pálinkáspohár")
							.unit("db").active(true).deleted(false).build(),
			};
			for (Product product : products) {
				productRepository.save(product);
			}
		}
	}

	private void initBOM() {
		if (bomItemRepository.count() == 0) {
			Product rawGlass = productRepository.findBySku("UG-2024").orElse(null);
			Product rawClay = productRepository.findBySku("KA-2024").orElse(null);
			Product handle = productRepository.findBySku("SZ-FOG-01").orElse(null);
			Product box = productRepository.findBySku("DOB-01").orElse(null);

			Product mug = productRepository.findBySku("KB-2024").orElse(null);
			Product waterGlass = productRepository.findBySku("VP-2024").orElse(null);
			Product beerGlass = productRepository.findBySku("SP-2024").orElse(null);
			Product wineGlass = productRepository.findBySku("BP-2024").orElse(null);
			Product shotGlass = productRepository.findBySku("PP-2024").orElse(null);

			if (rawGlass != null && rawClay != null && handle != null && box != null) {
				if (mug != null) {
					bomItemRepository.save(BOMItem.builder().parentProduct(mug)
							.componentProduct(rawClay)
							.quantity(new BigDecimal("0.3500")).active(true).build());
					bomItemRepository.save(BOMItem.builder().parentProduct(mug)
							.componentProduct(handle)
							.quantity(new BigDecimal("1.0000")).active(true).build());
					bomItemRepository.save(BOMItem.builder().parentProduct(mug)
							.componentProduct(box)
							.quantity(new BigDecimal("1.0000")).active(true).build());
				}

				if (waterGlass != null) {
					bomItemRepository.save(BOMItem.builder().parentProduct(waterGlass)
							.componentProduct(rawGlass)
							.quantity(new BigDecimal("0.2500")).active(true).build());
					bomItemRepository.save(BOMItem.builder().parentProduct(waterGlass)
							.componentProduct(box)
							.quantity(new BigDecimal("1.0000")).active(true).build());
				}

				if (beerGlass != null) {
					bomItemRepository.save(BOMItem.builder().parentProduct(beerGlass)
							.componentProduct(rawGlass)
							.quantity(new BigDecimal("0.5500")).active(true).build());
					bomItemRepository.save(BOMItem.builder().parentProduct(beerGlass)
							.componentProduct(box)
							.quantity(new BigDecimal("1.0000")).active(true).build());
				}

				if (wineGlass != null) {
					bomItemRepository.save(BOMItem.builder().parentProduct(wineGlass)
							.componentProduct(rawGlass)
							.quantity(new BigDecimal("0.2000")).active(true).build());
					bomItemRepository.save(BOMItem.builder().parentProduct(wineGlass)
							.componentProduct(box)
							.quantity(new BigDecimal("1.0000")).active(true).build());
				}

				if (shotGlass != null) {
					bomItemRepository.save(BOMItem.builder().parentProduct(shotGlass)
							.componentProduct(rawGlass)
							.quantity(new BigDecimal("0.1000")).active(true).build());
					bomItemRepository.save(BOMItem.builder().parentProduct(shotGlass)
							.componentProduct(box)
							.quantity(new BigDecimal("1.0000")).active(true).build());
				}
			}
		}
	}

	private void initInventory() {
		if (inventoryRepository.count() == 0) {
			saveInventory("UG-2024", new BigDecimal("500.0000"), new BigDecimal("25.0000"), "A-01-01");
			saveInventory("KA-2024", new BigDecimal("350.0000"), new BigDecimal("15.0000"), "A-01-02");
			saveInventory("SZ-FOG-01", new BigDecimal("1200.0000"), new BigDecimal("50.0000"), "B-02-01");
			saveInventory("DOB-01", new BigDecimal("2500.0000"), new BigDecimal("100.0000"), "B-02-02");

			saveInventory("KB-2024", new BigDecimal("150.0000"), new BigDecimal("0.0000"), "K-01-01");
			saveInventory("VP-2024", new BigDecimal("300.0000"), new BigDecimal("20.0000"), "K-01-02");
			saveInventory("SP-2024", new BigDecimal("200.0000"), new BigDecimal("10.0000"), "K-01-03");
			saveInventory("BP-2024", new BigDecimal("180.0000"), new BigDecimal("0.0000"), "K-02-01");
			saveInventory("PP-2024", new BigDecimal("450.0000"), new BigDecimal("0.0000"), "K-02-02");
		}
	}

	private void saveInventory(String sku, BigDecimal quantity, BigDecimal reserved, String location) {
		productRepository.findBySku(sku).ifPresent(product -> {
			Inventory inv = Inventory.builder()
					.product(product)
					.quantity(quantity)
					.reservedQuantity(reserved)
					.location(location)
					.build();
			inventoryRepository.save(inv);
		});
	}

	private void initWorkOrder() {
		if (workOrderRepository.count() == 0) {
			User bela = userRepository.findByName("bela").orElse(null);
			User tomi = userRepository.findByName("tomi").orElse(null);
			User zoli = userRepository.findByName("zoli").orElse(null);

			Product mug = productRepository.findBySku("KB-2024").orElse(null);
			Product beerGlass = productRepository.findBySku("SP-2024").orElse(null);
			Product wineGlass = productRepository.findBySku("BP-2024").orElse(null);
			Product waterGlass = productRepository.findBySku("VP-2024").orElse(null);
			Product shotGlass = productRepository.findBySku("PP-2024").orElse(null);

			if (mug != null) {
				workOrderRepository.save(WorkOrder.builder()
						.orderNumber("WO-20260817-001")
						.product(mug)
						.assignedUser(bela)
						.customerName("Gasztró Trend Kft.")
						.targetQuantity(new BigDecimal("100.0000"))
						.producedQuantity(new BigDecimal("100.0000"))
						.scrapQuantity(new BigDecimal("2.0000"))
						.status(WorkOrderStatus.COMPLETED)
						.priority(WorkOrderPriority.HIGH)
						.startDate(LocalDateTime.now().minusDays(2))
						.endDate(LocalDateTime.now().minusDays(1))
						.build());
			}

			if (beerGlass != null) {
				workOrderRepository.save(WorkOrder.builder()
						.orderNumber("WO-20260817-002")
						.product(beerGlass)
						.assignedUser(tomi)
						.customerName("Borsodi Sörgyár Zrt.")
						.targetQuantity(new BigDecimal("250.0000"))
						.producedQuantity(new BigDecimal("180.0000"))
						.scrapQuantity(new BigDecimal("5.0000"))
						.status(WorkOrderStatus.IN_PROGRESS)
						.priority(WorkOrderPriority.URGENT)
						.startDate(LocalDateTime.now().minusHours(5))
						.build());
			}

			if (wineGlass != null) {
				workOrderRepository.save(WorkOrder.builder()
						.orderNumber("WO-20260817-003")
						.product(wineGlass)
						.assignedUser(zoli)
						.customerName("Tokaj Borászat Kft.")
						.targetQuantity(new BigDecimal("80.0000"))
						.producedQuantity(new BigDecimal("80.0000"))
						.scrapQuantity(new BigDecimal("1.0000"))
						.status(WorkOrderStatus.QUALITY_CHECK)
						.priority(WorkOrderPriority.HIGH)
						.startDate(LocalDateTime.now().minusHours(8))
						.build());
			}

			if (waterGlass != null) {
				workOrderRepository.save(WorkOrder.builder()
						.orderNumber("WO-20260817-004")
						.product(waterGlass)
						.assignedUser(bela)
						.customerName("Danone Hungary")
						.targetQuantity(new BigDecimal("150.0000"))
						.producedQuantity(BigDecimal.ZERO)
						.scrapQuantity(BigDecimal.ZERO)
						.status(WorkOrderStatus.PREPARED)
						.priority(WorkOrderPriority.MEDIUM)
						.build());
			}

			if (shotGlass != null) {
				workOrderRepository.save(WorkOrder.builder()
						.orderNumber("WO-20260817-005")
						.product(shotGlass)
						.assignedUser(null)
						.customerName("Zwack Unicum Nyrt.")
						.targetQuantity(new BigDecimal("500.0000"))
						.producedQuantity(BigDecimal.ZERO)
						.scrapQuantity(BigDecimal.ZERO)
						.status(WorkOrderStatus.PLANNED)
						.priority(WorkOrderPriority.LOW)
						.build());
			}
		}
	}
}
