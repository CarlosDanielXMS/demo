package com.teste.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.teste.demo.model.Profissional;

public interface ProfissionalRepository extends JpaRepository<Profissional, Integer> {
    List<Profissional> findByStatus(Short status);

    @Query("SELECT p FROM Profissional p WHERE " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:nome IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', :nome, '%'))) AND " +
            "(:telefone IS NULL OR p.telefone LIKE CONCAT('%', :telefone, '%')) AND " +
            "(:email IS NULL OR LOWER(p.email) LIKE LOWER(CONCAT('%', :email, '%')))")
    List<Profissional> filtrarProfissionais(
            @Param("status") Short status,
            @Param("nome") String nome,
            @Param("telefone") String telefone,
            @Param("email") String email);

    Optional<Profissional> findByEmailAndSenha(String email, String senha);
}
