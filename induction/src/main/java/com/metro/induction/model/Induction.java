package com.metro.induction.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "inductions")
public class Induction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rake_id", nullable = false)
    private Rake rake;

    @Column(name = "induction_date", nullable = false)
    private LocalDate inductionDate;

    @Column(name = "assigned_line")
    private String assignedLine;

    @Column(name = "departure_time")
    private LocalTime departureTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Rake getRake() { return rake; }
    public void setRake(Rake rake) { this.rake = rake; }
    public LocalDate getInductionDate() { return inductionDate; }
    public void setInductionDate(LocalDate inductionDate) { this.inductionDate = inductionDate; }
    public String getAssignedLine() { return assignedLine; }
    public void setAssignedLine(String assignedLine) { this.assignedLine = assignedLine; }
    public LocalTime getDepartureTime() { return departureTime; }
    public void setDepartureTime(LocalTime departureTime) { this.departureTime = departureTime; }
}