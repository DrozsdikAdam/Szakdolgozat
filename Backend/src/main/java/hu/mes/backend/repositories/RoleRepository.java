package hu.mes.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hu.mes.backend.models.Role;
import hu.mes.backend.models.enums.RolesEnum;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByName(RolesEnum name);

    List<Role> findByActiveTrue();

    List<Role> findByActiveFalse();
}
