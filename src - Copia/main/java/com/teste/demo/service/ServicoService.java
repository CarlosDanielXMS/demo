package com.teste.demo.service;

import com.teste.demo.model.Servico;
import com.teste.demo.repository.ServicoRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class ServicoService {

    private final ServicoRepository repo;

    public List<Servico> listar(String status, String descricao, Integer tempoMedioMin, BigDecimal valorMin) {
        Short st = parseStatus(status);
        return repo.filtrarServicos(
                st,
                StringUtils.hasText(descricao) ? descricao : null,
                tempoMedioMin,
                valorMin);
    }

    public Servico buscarPorId(Integer id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Serviço não encontrado: " + id));
    }

    @Transactional
    public Servico criar(Servico body) {
        sanitizeServicoData(body);
        if (body.getStatus() == null)
            body.setStatus((short) 1);

        if (repo.existsByDescricao(body.getDescricao())) {
            throw new IllegalArgumentException("Servico já cadastrado");
        }

        return repo.save(body);
    }

    @Transactional
    public Servico atualizar(Integer id, Servico body) {
        Servico existente = buscarPorId(id);
        sanitizeServicoData(body);

        if (!existente.getDescricao().equals(body.getDescricao()) &&
                repo.existsByDescricao(body.getDescricao())) {
            throw new IllegalArgumentException("Essa descrição já está em uso por outro serviço");
        }

        body.setId(existente.getId());
        if (body.getStatus() == null)
            body.setStatus(existente.getStatus());
        return repo.save(body);
    }

    @Transactional
    public void inativar(Integer id) {
        Servico existente = buscarPorId(id);
        existente.setStatus((short) 2);
        repo.save(existente);
    }

    @Transactional
    public void reativar(Integer id) {
        Servico existente = buscarPorId(id);
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

    private void sanitizeServicoData(Servico servico) {
        Optional.ofNullable(servico.getDescricao()).ifPresent(desc -> servico.setDescricao(desc.trim()));
    }
}
