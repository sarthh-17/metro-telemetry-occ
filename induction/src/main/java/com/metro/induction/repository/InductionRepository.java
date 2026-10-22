package com.metro.induction.repository;

import com.metro.induction.model.Induction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InductionRepository extends JpaRepository<Induction, Long> {
}