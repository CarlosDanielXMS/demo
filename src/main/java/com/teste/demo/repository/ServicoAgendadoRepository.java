package com.teste.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.teste.demo.model.ServicoAgendado;
import com.teste.demo.model.ServicoAgendadoId;

public interface ServicoAgendadoRepository 
  extends JpaRepository<ServicoAgendado, ServicoAgendadoId> {
    List<ServicoAgendado> findByStatus(Short status);
}
