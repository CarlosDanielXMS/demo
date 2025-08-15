package com.teste.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.teste.demo.model.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {
    List<Cliente> findByStatus(Short status);
}
