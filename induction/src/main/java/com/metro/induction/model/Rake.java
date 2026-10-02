package com.metro.induction.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "rakes")
public class Rake {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rake_number", unique = true, nullable = false)
    private String rakeNumber;

    @Column(name = "total_mileage")
    private Integer totalMileage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RakeStatus status;

    @Column(name = "fitness_expiry_date")
    private LocalDate fitnessExpiryDate;

    public Rake() {}

    public Rake(String rakeNumber, Integer totalMileage, RakeStatus status, LocalDate fitnessExpiryDate) {
        this.rakeNumber = rakeNumber;
        this.totalMileage = totalMileage;
        this.status = status;
        this.fitnessExpiryDate = fitnessExpiryDate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRakeNumber() { return rakeNumber; }
    public void setRakeNumber(String rakeNumber) { this.rakeNumber = rakeNumber; }
    public Integer getTotalMileage() { return totalMileage; }
    public void setTotalMileage(Integer totalMileage) { this.totalMileage = totalMileage; }
    public RakeStatus getStatus() { return status; }
    public void setStatus(RakeStatus status) { this.status = status; }
    public LocalDate getFitnessExpiryDate() { return fitnessExpiryDate; }
    public void setFitnessExpiryDate(LocalDate fitnessExpiryDate) { this.fitnessExpiryDate = fitnessExpiryDate; }
}