package com.teste.demo.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.teste.demo.model.Agenda;

public interface AgendaRepository extends JpaRepository<Agenda, Integer> {
        List<Agenda> findByStatus(Short status);

        @Query("SELECT a FROM Agenda a LEFT JOIN FETCH a.servicosAgendados WHERE a.id = :id")
        Optional<Agenda> findByIdWithServicos(@Param("id") Integer id);

        @Query("SELECT a FROM Agenda a " +
                        "WHERE (:data IS NULL OR CAST(a.dataHora AS date) = CAST(:data AS date)) AND " +
                        "(:clienteId IS NULL OR a.cliente.id = :clienteId) AND" +
                        "(:status IS NULL OR a.status = :status) AND" +
                        "(:tempoTotalMin IS NULL OR a.tempoTotal >= :tempoTotalMin) AND " +
                        "(:valorTotalMin IS NULL OR a.valorTotal >= :valorTotalMin)")
        List<Agenda> filtrarAgendas(
                        @Param("data") LocalDate data,
                        @Param("clienteId") Integer clienteId,
                        @Param("status") Short status,
                        @Param("tempoTotalMin") Integer tempoTotalMin,
                        @Param("valorTotalMin") BigDecimal valorTotalMin);

        @Query("SELECT CASE WHEN COUNT(a) > 0 THEN TRUE ELSE FALSE END " +
                        "FROM Agenda a JOIN a.servicosAgendados sa " +
                        "WHERE sa.profissional.id = :profissionalId " +
                        "AND a.status = 1 " +
                        "AND sa.status = 1 " +
                        "AND a.id <> :excludeAgendaId " +
                        "AND (:inicio < FUNCTION('TIMESTAMPADD', MINUTE, a.tempoTotal, a.dataHora)) " +
                        "AND (:fim > a.dataHora)")
        boolean existsConflitoAgendamento(
                        @Param("profissionalId") Integer profissionalId,
                        @Param("inicio") LocalDateTime inicio,
                        @Param("fim") LocalDateTime fim,
                        @Param("excludeAgendaId") Integer excludeAgendaId);

        @Query("SELECT CASE WHEN COUNT(sa) > 0 THEN TRUE ELSE FALSE END " +
                        "FROM ServicoAgendado sa " +
                        "JOIN sa.agenda a " +
                        "WHERE sa.profissional.id = :profissionalId " +
                        "AND a.status = 1 " +
                        "AND sa.status = 1 " +
                        "AND (:excludeAgendaId IS NULL OR a.id <> :excludeAgendaId) " +
                        "AND (:inicio < FUNCTION('TIMESTAMPADD', MINUTE, a.tempoTotal, a.dataHora)) " +
                        "AND (:fim > a.dataHora)")
        boolean existsConflitoProfissional(
                        @Param("profissionalId") Integer profissionalId,
                        @Param("inicio") LocalDateTime inicio,
                        @Param("fim") LocalDateTime fim,
                        @Param("excludeAgendaId") Integer excludeAgendaId);

        @Query(value = "SELECT * FROM fn_ProfissionaisDisponiveis(:idServico, :dataHora)", nativeQuery = true)
        List<Object[]> findProfissionaisDisponiveis(
                        @Param("idServico") Integer idServico,
                        @Param("dataHora") LocalDateTime dataHora);
}
