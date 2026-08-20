package hu.mes.backend.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import hu.mes.backend.dtos.machine.MachineCreateRequest;
import hu.mes.backend.dtos.machine.MachineResponse;
import hu.mes.backend.dtos.machine.MachineUpdateRequest;
import hu.mes.backend.mappers.MachineMapper;
import hu.mes.backend.models.Machine;
import hu.mes.backend.models.User;
import hu.mes.backend.models.enums.MachineStatus;
import hu.mes.backend.models.enums.MachineType;
import hu.mes.backend.repositories.MachineRepository;
import hu.mes.backend.repositories.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class MachineService {

    private final MachineRepository machineRepository;
    private final MachineMapper machineMapper;
    private final UserRepository userRepository;

    public List<MachineResponse> getAllMachines() {
        List<Machine> machines = machineRepository.findByActiveTrue();
        List<MachineResponse> responses = machineMapper.convertToResponses(machines);
        return responses;
    }

    public MachineResponse getMachineById(UUID id) {
        Machine machine = getMachineEntityById(id);
        return machineMapper.convertToResponse(machine);
    }

    public List<MachineResponse> getMachinesByStatus(MachineStatus status) {
        List<Machine> machines = machineRepository.findByStatus(status);
        List<MachineResponse> responses = machineMapper.convertToResponses(machines);
        return responses;
    }

    public List<MachineResponse> getMachinesByType(MachineType type) {
        List<Machine> machines = machineRepository.findByType(type);
        List<MachineResponse> responses = machineMapper.convertToResponses(machines);
        return responses;
    }

    public List<MachineResponse> getMachinesByUserId(UUID id) {
        List<Machine> machines = machineRepository.findByAssignedUserId(id);
        List<MachineResponse> responses = machineMapper.convertToResponses(machines);
        return responses;
    }

    public List<MachineResponse> getMachinesByTypeAndStatus(MachineType type, MachineStatus status) {
        List<Machine> machines = machineRepository.findByTypeAndStatus(type, status);
        List<MachineResponse> responses = machineMapper.convertToResponses(machines);
        return responses;
    }

    public MachineResponse createMachine(MachineCreateRequest request) {
        if (request == null)
            throw new IllegalArgumentException("A gép adatai nem lehetnek üresek!");
        boolean exists = machineRepository.existsByCode(request.getCode());
        if (exists)
            throw new IllegalArgumentException("A megadott gépkód már létezik!");
        User user = null;
        if (request.getAssignedUserId() != null
                && userRepository.existsById(request.getAssignedUserId()))
            user = userRepository.findById(request.getAssignedUserId())
                    .orElseThrow(() -> new EntityNotFoundException("A keresett felhasználó nem található!"));

        Machine machine = Machine.builder()
                .code(request.getCode())
                .name(request.getName())
                .type(request.getType())
                .status(request.getStatus())
                .manufacturer(request.getManufacturer())
                .model(request.getModel())
                .serialNumber(request.getSerialNumber())
                .warrantyNumber(request.getWarrantyNumber())
                .warrantyEndDate(request.getWarrantyEndDate())
                .idealCycleTimeSeconds(request.getIdealCycleTimeSeconds())
                .targetPcsPerHour(request.getTargetPcsPerHour())
                .location(request.getLocation())
                .assignedUser(user)
                .build();

        machineRepository.save(machine);
        return machineMapper.convertToResponse(machine);
    }

    public MachineResponse updateMachine(UUID id, MachineUpdateRequest request) {
        if (request == null)
            throw new IllegalArgumentException("A gép adatai nem lehetnek üresek!");

        Machine machine = getMachineEntityById(id);

        if (!request.getCode().equals(machine.getCode())
                && machineRepository.existsByCode(request.getCode()))
            throw new IllegalArgumentException("A gép kódja már létezik!");

        if (request.getAssignedUserId() != null
                && !userRepository.existsById(request.getAssignedUserId()))
            throw new IllegalArgumentException("A kijelölt felhasználó nem létezik!");

        machine.setCode(request.getCode());
        machine.setName(request.getName());
        machine.setType(request.getType());
        machine.setStatus(request.getStatus());
        machine.setManufacturer(request.getManufacturer());
        machine.setModel(request.getModel());
        machine.setSerialNumber(request.getSerialNumber());
        machine.setWarrantyNumber(request.getWarrantyNumber());
        machine.setWarrantyEndDate(request.getWarrantyEndDate());
        machine.setIdealCycleTimeSeconds(request.getIdealCycleTimeSeconds());
        machine.setTargetPcsPerHour(request.getTargetPcsPerHour());
        machine.setLocation(request.getLocation());
        machine.setAssignedUser(request.getAssignedUserId() != null
                ? userRepository.findById(request.getAssignedUserId())
                        .orElseThrow(() -> new EntityNotFoundException("A keresett felhasználó nem található!"))
                : null);

        machineRepository.save(machine);
        return machineMapper.convertToResponse(machine);
    }

    public MachineResponse updateMachineStatus(UUID id, MachineStatus status) {

        Machine machine = getMachineEntityById(id);

        machine.setStatus(status);
        machineRepository.save(machine);
        return machineMapper.convertToResponse(machine);
    }

    public MachineResponse updateMachineUser(UUID id, UUID userId) {

        if (!userRepository.existsById(userId))
            throw new EntityNotFoundException("A keresett felhasználó nem található!");

        Machine machine = getMachineEntityById(id);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("A keresett felhasználó nem található!"));

        machine.setAssignedUser(user);
        machineRepository.save(machine);
        return machineMapper.convertToResponse(machine);
    }

    public MachineResponse unassignMachine(UUID id) {

        Machine machine = getMachineEntityById(id);

        machine.setAssignedUser(null);
        machineRepository.save(machine);
        return machineMapper.convertToResponse(machine);
    }

    public void deleteMachine(UUID id) {

        Machine machine = getMachineEntityById(id);

        machine.setDeletedAt(LocalDateTime.now());
        machine.setActive(false);
        machineRepository.save(machine);
    }

    public void restoreMachine(UUID id) {

        Machine machine = machineRepository.findByIdAndDeletedAtNotNull(id)
                .orElseThrow(() -> new EntityNotFoundException("A keresett gép nem található!"));

        machine.setDeletedAt(null);
        machine.setActive(true);
        machineRepository.save(machine);
    }

    public void deactivateMachine(UUID id) {
        Machine machine = getMachineEntityById(id);
        machine.setActive(false);
        machineRepository.save(machine);
    }

    public void activateMachine(UUID id) {
        Machine machine = getMachineEntityById(id);
        machine.setActive(true);
        machineRepository.save(machine);
    }

    public List<MachineResponse> getDeletedMachines() {
        List<Machine> machines = machineRepository.findByDeletedAtNotNull();
        return machineMapper.convertToResponses(machines);
    }

    public List<MachineResponse> getInactiveMachines() {
        List<Machine> machines = machineRepository.findByActiveFalse();
        return machineMapper.convertToResponses(machines);
    }

    private Machine getMachineEntityById(UUID id) {
        return machineRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("A keresett gép nem található!"));
    }

}
