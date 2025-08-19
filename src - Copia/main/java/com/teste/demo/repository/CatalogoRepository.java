package com.teste.demo.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.teste.demo.model.Catalogo;
import com.teste.demo.model.CatalogoId;
import com.teste.demo.model.Profissional;

public interface CatalogoRepository
    extends JpaRepository<Catalogo, CatalogoId> {

  boolean existsByIdAndStatus(CatalogoId id, Short status);

  @Query("SELECT DISTINCT c.profissional FROM Catalogo c " +
      "WHERE c.servico.id = :servicoId AND " +
      "c.status = 1 AND " +
      "c.profissional.status = 1")
  List<Profissional> findProfissionaisByServico(@Param("servicoId") Integer servicoId);

  @Query("SELECT c FROM Catalogo c " +
      "WHERE (:profissionalId IS NULL OR c.profissional.id = :profissionalId) AND " +
      "(:servicoId IS NULL OR c.servico.id = :servicoId) AND " +
      "(:status IS NULL OR c.status = :status) AND " +
      "(:tempoMedioMin IS NULL OR c.tempoMedio >= :tempoMedioMin) AND" +
      "(:valorMin IS NULL OR c.valor >= :valorMin)")
  List<Catalogo> filtrarCatalogos(
      @Param("profissionalId") Integer profissionalId,
      @Param("servicoId") Integer servicoId,
      @Param("status") Short status,
      @Param("tempoMedioMin") Integer tempoMedioMin,
      @Param("valorMin") BigDecimal valorMin);
}
