package com.teste.demo.service;

import com.teste.demo.model.Catalogo;
import com.teste.demo.model.CatalogoId;
import com.teste.demo.model.Profissional;
import com.teste.demo.model.Servico;
import com.teste.demo.repository.CatalogoRepository;
import com.teste.demo.repository.ProfissionalRepository;
import com.teste.demo.repository.ServicoRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class CatalogoService {

    private final CatalogoRepository repo;
    private final ProfissionalRepository profissionalRepo;
    private final ServicoRepository servicoRepo;

    public List<Catalogo> listar(Integer profissionalId, Integer servicoId, String status, Integer tempoMedioMin,
            BigDecimal valorMin) {
        Short st = parseStatus(status);
        return repo.filtrarCatalogos(profissionalId, servicoId, st, tempoMedioMin, valorMin);
    }

    public Catalogo buscarPorId(CatalogoId id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Catálogo não encontrado: " + id));
    }

    @Transactional
    public Catalogo criar(Catalogo body) {
        CatalogoId id = body.getId();
        if (id != null && repo.existsById(id)) {
            throw new IllegalArgumentException("Este profissional já presta esse serviço");
        }

        Profissional profissional = profissionalRepo.findById(body.getProfissional().getId())
                .orElseThrow(() -> new IllegalArgumentException("Profissional não encontrado"));
        body.setProfissional(profissional);

        Servico servico = servicoRepo.findById(body.getServico().getId())
                .orElseThrow(() -> new IllegalArgumentException("Serviço não encontrado"));
        body.setServico(servico);

        if (body.getStatus() == null)
            body.setStatus((short) 1);

        if (body.getValor() == null) {
            body.setValor(servico.getValor());
        }

        if (body.getTempoMedio() == null) {
            body.setTempoMedio(servico.getTempoMedio());
        }

        return repo.save(body);
    }

    @Transactional
    public Catalogo atualizar(CatalogoId id, Catalogo body) {
        Catalogo existente = buscarPorId(id);
        body.setId(existente.getId());

        if (!existente.getProfissional().getId().equals(body.getProfissional().getId()) ||
                !existente.getServico().getId().equals(body.getServico().getId())) {
            throw new IllegalArgumentException("Não é permitido alterar profissional ou serviço do catálogo");
        }

        if (body.getStatus() == null)
            body.setStatus(existente.getStatus());

        if (body.getValor() == null) {
            body.setValor(existente.getValor());
        }

        if (body.getTempoMedio() == null) {
            body.setTempoMedio(existente.getTempoMedio());
        }

        return repo.save(body);
    }

    @Transactional
    public void remover(CatalogoId id) {
        Catalogo existente = buscarPorId(id);
        existente.setStatus((short) 2);
        repo.save(existente);
    }

    @Transactional
    public void reativar(CatalogoId id) {
        Catalogo existente = buscarPorId(id);
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
}
