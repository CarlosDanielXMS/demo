package com.teste.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.teste.demo.model.Servico;

public interface ServicoRepository extends JpaRepository<Servico, Integer> {
    List<Servico> findByStatus(Short status);
}
