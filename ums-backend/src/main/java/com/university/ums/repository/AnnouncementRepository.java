package com.university.ums.repository;

import com.university.ums.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    /**
     * Returns active announcements for a role.
     * NOTE: We intentionally do NOT filter by expiresAt here —
     * expired announcements are still visible until admin deactivates them.
     * This prevents confusion where valid notices disappear silently.
     */
    @Query("""
        SELECT a FROM Announcement a
        WHERE a.isActive = true
          AND (a.targetRole = :allRole OR a.targetRole = :role)
        ORDER BY a.createdAt DESC
    """)
    List<Announcement> findActiveAnnouncementsForRole(
        @Param("role")    Announcement.TargetRole role,
        @Param("allRole") Announcement.TargetRole allRole
    );

    List<Announcement> findByIsActiveTrueOrderByCreatedAtDesc();
}
