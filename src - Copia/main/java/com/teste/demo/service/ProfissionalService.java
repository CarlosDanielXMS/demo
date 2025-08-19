package com.teste.demo.service;

import com.teste.demo.model.Profissional;
import com.teste.demo.repository.ProfissionalRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class ProfissionalService {

    private final ProfissionalRepository repo;

    public List<Profissional> listar(String status, String nome, String telefone, String email) {
        Short st = parseStatus(status);
        return repo.filtrarProfissionais(
                st,
                StringUtils.hasText(nome) ? nome : null,
                StringUtils.hasText(telefone) ? telefone : null,
                StringUtils.hasText(email) ? email : null);
    }

    public Profissional buscarPorId(Integer id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Profissional não encontrado: " + id));
    }

    @Transactional
    public Profissional criar(Profissional body) {
        sanitizeProfissionalData(body);
        if (body.getStatus() == null)
            body.setStatus((short) 1);
        return repo.save(body);
    }

    @Transactional
    public Profissional atualizar(Integer id, Profissional body) {
        Profissional existente = buscarPorId(id);
        sanitizeProfissionalData(body);

        body.setId(existente.getId());
        if (body.getStatus() == null)
            body.setStatus(existente.getStatus());

        return repo.save(body);
    }

    @Transactional
    public void inativar(Integer id) {
        Profissional existente = buscarPorId(id);
        existente.setStatus((short) 2);
        repo.save(existente);
    }

    @Transactional
    public void reativar(Integer id) {
        Profissional existente = buscarPorId(id);
        existente.setStatus((short) 1);
        repo.save(existente);
    }

    private Short parseStatus(String s) {
        if (!StringUtils.hasText(s))
            return null;
        if ("ATIVO".equalsIgnoreCase(s))
            return 1;
        if ("INATIVO".equalsIgnoreCase(s))
            return 2;
        try {
            return Short.parseShort(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void sanitizeProfissionalData(Profissional profissional) {
        Optional.ofNullable(profissional.getNome()).ifPresent(nome -> profissional.setNome(nome.trim()));

        Optional.ofNullable(profissional.getTelefone())
                .ifPresent(tel -> profissional.setTelefone(tel.replaceAll("[^0-9]", "")));

        Optional.ofNullable(profissional.getEmail())
                .ifPresent(email -> profissional.setEmail(email.trim().toLowerCase()));
    }
}
