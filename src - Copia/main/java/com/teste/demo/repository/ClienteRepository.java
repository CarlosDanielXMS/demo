package com.teste.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.teste.demo.model.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Integer> {
    List<Cliente> findByStatus(Short status);

    @Query("SELECT c FROM Cliente c WHERE " +
            "(:status IS NULL OR c.status = :status) AND " +
            "(:nome IS NULL OR LOWER(c.nome) LIKE LOWER(CONCAT('%', :nome, '%'))) AND " +
            "(:telefone IS NULL OR c.telefone LIKE CONCAT('%', :telefone, '%')) AND " +
            "(:email IS NULL OR LOWER(c.email) LIKE LOWER(CONCAT('%', :email, '%')))")
    List<Cliente> filtrarClientes(
            @Param("status") Short status,
            @Param("nome") String nome,
            @Param("telefone") String telefone,
            @Param("email") String email);
}
