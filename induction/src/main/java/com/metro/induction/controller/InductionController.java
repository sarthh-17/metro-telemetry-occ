package com.metro.induction.controller;

import com.metro.induction.model.Induction;
import com.metro.induction.repository.InductionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inductions")
@CrossOrigin(origins = "http://localhost:3000")
public class InductionController {

    @Autowired
    private InductionRepository inductionRepository;

    @GetMapping
    public List<Induction> getAllInductions() {
        return inductionRepository.findAll();
    }

    @PostMapping
    public Induction createInduction(@RequestBody Induction induction) {
        return inductionRepository.save(induction);
    }
}