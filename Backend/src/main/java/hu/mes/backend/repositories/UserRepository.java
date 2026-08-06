package hu.mes.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hu.mes.backend.models.User;
import hu.mes.backend.models.enums.RolesEnum;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    @Override
    @EntityGraph(attributePaths = "roles")
    List<User> findAll();

    @EntityGraph(attributePaths = "roles")
    Optional<User> findByNameAndActiveTrue(String name);

    @EntityGraph(attributePaths = "roles")
    Optional<User> findByIdAndActiveTrue(UUID id);

    @EntityGraph(attributePaths = "roles")
    Optional<User> findByEmailAndActiveTrue(String email);

    @EntityGraph(attributePaths = "roles")
    List<User> findByActiveFalse();

    @EntityGraph(attributePaths = "roles")
    List<User> findByActiveTrueAndRoles_Name(RolesEnum roleName);

    @EntityGraph(attributePaths = "roles")
    List<User> findByActiveFalseAndRoles_Name(RolesEnum roleName);
}
