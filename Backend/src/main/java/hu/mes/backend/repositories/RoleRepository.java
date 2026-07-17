package hu.mes.backend.repositories;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import hu.mes.backend.models.Role;
import hu.mes.backend.models.RolesEnum;

public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByName(RolesEnum name);

    Set<Role> findByActiveTrue();

    Set<Role> findByActiveFalse();
}
