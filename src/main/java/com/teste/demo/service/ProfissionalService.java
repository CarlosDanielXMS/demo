package com.teste.demo.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.teste.demo.model.Profissional;
import com.teste.demo.repository.ProfissionalRepository;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
@Transactional(readOnly = true)
public class ProfissionalService {

    private final ProfissionalRepository repo;

    public List<Profissional> listarTodos() {
        return repo.findAll();
    }

    public List<Profissional> listarAtivos() {
        return repo.findByStatus((short)1);
    }

    public Profissional buscarPorId(Integer id) {
        return repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Profissional não encontrado: " + id));
    }

    @Transactional
    public Profissional criar(Profissional prof) {
        return repo.save(prof);
    }

    @Transactional
    public Profissional atualizar(Integer id, Profissional dados) {
        Profissional existente = buscarPorId(id);
        existente.setNome(dados.getNome());
        existente.setTelefone(dados.getTelefone());
        existente.setEmail(dados.getEmail());
        existente.setSalarioFixo(dados.getSalarioFixo());
        existente.setComissao(dados.getComissao());
        if (dados.getSenha() != null && !dados.getSenha().isBlank()) {
            existente.setSenha(dados.getSenha());
        }
        return repo.save(existente);
    }

    @Transactional
    public void inativar(Integer id) {
        Profissional existente = buscarPorId(id);
        existente.setStatus((short)2);
        repo.save(existente);
    }

    @Transactional
    public void reativar(Integer id) {
        Profissional existente = buscarPorId(id);
        existente.setStatus((short)1);
        repo.save(existente);
    }
}
