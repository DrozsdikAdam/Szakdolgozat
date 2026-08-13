package hu.mes.backend.config;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import hu.mes.backend.models.Role;
import hu.mes.backend.models.User;
import hu.mes.backend.models.enums.RolesEnum;
import hu.mes.backend.repositories.RoleRepository;
import hu.mes.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Initialize all roles from the enum if they do not exist yet
        for (RolesEnum roleEnum : RolesEnum.values()) {
            Optional<Role> roleOpt = roleRepository.findByName(roleEnum);
            if (roleOpt.isEmpty()) {
                Role newRole = new Role();
                newRole.setName(roleEnum);
                newRole.setActive(true);
                roleRepository.save(newRole);
            }
        }

        // Initialize or re-activate the default SYSTEMADMIN user
        Role adminRole = roleRepository.findByName(RolesEnum.SYSTEMADMIN)
                .orElseThrow(() -> new RuntimeException("Hiba: A SYSTEMADMIN szerepkör nem található!"));

        Optional<User> adminOpt = userRepository.findByName("admin");
        if (adminOpt.isEmpty()) {
            User admin = new User();
            admin.setName("admin");
            admin.setPassword(passwordEncoder.encode("Admin1234!"));
            admin.setEmail("admin@mes.hu");
            admin.setPhoneNumber("+36301234567");
            admin.setActive(true);

            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            admin.setRoles(roles);

            userRepository.save(admin);
            System.out.println("Az admin felhasználó sikeresen létrehozva.");
        } else {
            User admin = adminOpt.get();
            admin.setActive(true);
            admin.setPassword(passwordEncoder.encode("Admin1234!"));
            userRepository.save(admin);
            System.out.println("Az admin felhasználó státusza és jelszava frissítve.");
        }
    }
}
