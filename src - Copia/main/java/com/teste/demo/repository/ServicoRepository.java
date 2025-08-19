package com.teste.demo.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.teste.demo.model.Servico;

public interface ServicoRepository extends JpaRepository<Servico, Integer> {

    boolean existsByDescricao(String descricao);

    @Query("SELECT s FROM Servico s WHERE " +
            "(:status IS NULL OR s.status = :status) AND " +
            "(:descricao IS NULL OR LOWER(s.descricao) LIKE LOWER(CONCAT('%', :descricao, '%'))) AND " +
            "(:tempoMedioMin IS NULL OR s.tempoMedio >= :tempoMedioMin) AND" +
            "(:valorMin IS NULL OR s.valor >= :valorMin)")
    List<Servico> filtrarServicos(
            @Param("status") Short status,
            @Param("descricao") String descricao,
            @Param("tempoMedioMin") Integer tempoMedioMin,
            @Param("valorMin") BigDecimal valorMin);
}
