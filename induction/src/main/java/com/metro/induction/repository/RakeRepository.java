package com.metro.induction.repository;

import com.metro.induction.model.Rake;
import org.springframework.data.jpa.repository.JpaRepository;
import com.metro.induction.model.RakeStatus;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RakeRepository extends JpaRepository<Rake, Long> {
    List<Rake> findByStatus(RakeStatus status);
}