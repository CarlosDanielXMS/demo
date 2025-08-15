package com.teste.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.teste.demo.model.Catalogo;
import com.teste.demo.model.CatalogoId;

public interface CatalogoRepository 
  extends JpaRepository<Catalogo, CatalogoId> {
    List<Catalogo> findByStatus(Short status);
    boolean existsByIdAndStatus(CatalogoId id, Short status);
}
