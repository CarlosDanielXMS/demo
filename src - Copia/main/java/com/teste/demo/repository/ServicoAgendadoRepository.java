package com.teste.demo.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.teste.demo.model.ServicoAgendado;
import com.teste.demo.model.ServicoAgendadoId;

public interface ServicoAgendadoRepository
    extends JpaRepository<ServicoAgendado, ServicoAgendadoId> {

  List<ServicoAgendado> findByProfissionalIdAndStatus(Integer profissionalId, Short status);

  @Query("SELECT sa FROM ServicoAgendado sa " +
      "WHERE (:agendaId IS NULL OR sa.agenda.id = :agendaId) " +
      "AND (:servicoId IS NULL OR sa.servico.id = :servicoId) " +
      "AND (:profissionalId IS NULL OR sa.profissional.id = :profissionalId) " +
      "AND (:status IS NULL OR sa.status = :status) " +
      "AND (:valorMin IS NULL OR sa.valor >= :valorMin)")
  List<ServicoAgendado> filtrarServicosAgendados(
      @Param("agendaId") Integer agendaId,
      @Param("servicoId") Integer servicoId,
      @Param("profissionalId") Integer profissionalId,
      @Param("status") Short status,
      @Param("valorMin") BigDecimal valorMin);
}
