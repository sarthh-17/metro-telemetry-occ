package com.metro.induction.controller;

import com.metro.induction.model.Rake;
import com.metro.induction.repository.RakeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rakes")
@CrossOrigin(origins = {"http://localhost:5173","http://localhost:5174"})

public class RakeController {

    @Autowired
    private RakeRepository rakeRepository;

    @GetMapping
    public List<Rake> getAllRakes() {
        return rakeRepository.findAll();
    }

    @PostMapping
    public Rake createRake(@RequestBody Rake rake) {
        return rakeRepository.save(rake);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Rake> getRakeById(@PathVariable Long id) {
        return rakeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- ADDED: Delete endpoint ---
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRake(@PathVariable Long id) {
        if (!rakeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        rakeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
   
}