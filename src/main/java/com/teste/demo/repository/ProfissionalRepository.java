package com.teste.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.teste.demo.model.Profissional;

public interface ProfissionalRepository extends JpaRepository<Profissional, Integer> {
    List<Profissional> findByStatus(Short status);
}
