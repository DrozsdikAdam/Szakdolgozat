package hu.mes.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hu.mes.backend.models.Machine;
import hu.mes.backend.models.enums.MachineStatus;
import hu.mes.backend.models.enums.MachineType;

@Repository
public interface MachineRepository extends JpaRepository<Machine, UUID> {

    Optional<Machine> findByCode(String code);

    Boolean existsByCode(String code);

    List<Machine> findByActiveTrue();

    List<Machine> findByStatus(MachineStatus status);

    List<Machine> findByType(MachineType type);

    Optional<Machine> findBySerialNumber(String serialNumber);

    Boolean existsBySerialNumber(String serialNumber);

    List<Machine> findByTypeAndStatus(MachineType type, MachineStatus status);

}
