package hu.mes.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import hu.mes.backend.models.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findTop50ByOrderByCreatedAtDesc();

    long countByReadFalse();

    List<Notification> findByReadFalse();

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.read = false")
    void markAllAsRead();

}
