package com.teste.demo.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.teste.demo.model.Cliente;
import com.teste.demo.repository.ClienteRepository;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
@Transactional(readOnly = true)
public class ClienteService {

    private final ClienteRepository repo;

    public List<Cliente> listarTodos() {
        return repo.findAll();
    }

    public List<Cliente> listarAtivos() {
        return repo.findByStatus((short)1);
    }

    public Cliente buscarPorId(Integer id) {
        return repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado: " + id));
    }

    @Transactional
    public Cliente criar(Cliente cliente) {
        return repo.save(cliente);
    }

    @Transactional
    public Cliente atualizar(Integer id, Cliente dados) {
        Cliente existente = buscarPorId(id);
        existente.setNome(dados.getNome());
        existente.setTelefone(dados.getTelefone());
        existente.setEmail(dados.getEmail());
        if (dados.getSenha() != null && !dados.getSenha().isBlank()) {
            existente.setSenha(dados.getSenha());
        }
        return repo.save(existente);
    }

    @Transactional
    public void inativar(Integer id) {
        Cliente existente = buscarPorId(id);
        existente.setStatus((short)2);
        repo.save(existente);
    }

    @Transactional
    public void reativar(Integer id) {
        Cliente existente = buscarPorId(id);
        existente.setStatus((short)1);
        repo.save(existente);
    }
}
