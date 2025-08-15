package com.teste.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.teste.demo.model.Agenda;

public interface AgendaRepository extends JpaRepository<Agenda, Integer> {
    List<Agenda> findByStatus(Short status);
}
