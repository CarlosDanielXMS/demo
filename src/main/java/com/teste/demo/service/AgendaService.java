package com.teste.demo.service;

import com.teste.demo.model.Agenda;
import com.teste.demo.model.Catalogo;
import com.teste.demo.model.CatalogoId;
import com.teste.demo.model.Profissional;
import com.teste.demo.model.ServicoAgendado;
import com.teste.demo.repository.AgendaRepository;
import com.teste.demo.repository.CatalogoRepository;
import com.teste.demo.repository.ServicoAgendadoRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class AgendaService {

    private final AgendaRepository repo;
    private final ServicoAgendadoRepository servicoAgendadoRepo;
    private final CatalogoRepository catalogoRepo;

    public List<Agenda> listar(LocalDate data, Integer clientId, String status, Integer tempoTotalMin,
            BigDecimal valorTotalMin) {
        Short st = parseStatus(status);
        return repo.filtrarAgendas(data, clientId, st, tempoTotalMin, valorTotalMin);
    }

    public Agenda buscarPorId(Integer id) {
        return repo.findByIdWithServicos(id)
                .orElseThrow(() -> new IllegalArgumentException("Agenda não encontrada: " + id));
    }

    @Transactional
    public Agenda criar(Agenda body) {
        validarCriacao(body);
        if (body.getStatus() == null)
            body.setStatus((short) 1);
        return repo.save(body);
    }

    @Transactional
    public Agenda atualizar(Integer id, Agenda body) {
        Agenda existente = buscarPorId(id);
        validarAtualizacao(existente, body);
        existente.setDataHora(body.getDataHora());
        if (body.getStatus() != null)
            existente.setStatus(body.getStatus());
        return repo.save(existente);
    }

    @Transactional
    public void recalcularTotais(Integer agendaId) {
        Agenda agenda = buscarPorId(agendaId);

        BigDecimal valorTotal = BigDecimal.ZERO;
        int tempoTotal = 0;

        for (ServicoAgendado sa : agenda.getServicosAgendados()) {
            if (sa.getStatus() != 1)
                continue;

            valorTotal = valorTotal.add(sa.getValor());

            Catalogo catalogo = catalogoRepo.findById(new CatalogoId(
                    sa.getProfissional().getId(),
                    sa.getServico().getId()))
                    .orElseThrow(() -> new IllegalStateException("Catálogo inconsistente"));

            Integer tempo = Optional.ofNullable(catalogo.getTempoMedio())
                    .orElse(catalogo.getServico().getTempoMedio());

            tempoTotal += tempo;
        }

        agenda.setValorTotal(valorTotal);
        agenda.setTempoTotal(tempoTotal);

        repo.save(agenda);

        System.out.println("[DEBUG] Agenda ID: " + agendaId +
                " | Serviços: " + agenda.getServicosAgendados().size() +
                " | Valor Total: " + valorTotal +
                " | Tempo Total: " + tempoTotal);
    }

    @Transactional
    public void inativar(Integer id) {
        Agenda existente = buscarPorId(id);

        existente.setStatus((short) 2);
        repo.save(existente);

        inativarServicosAgendados(existente);
    }

    @Transactional
    public void reativar(Integer id) {
        Agenda existente = buscarPorId(id);

        existente.setStatus((short) 1);
        repo.save(existente);

        reativarServicosAgendados(existente);
        recalcularTotais(existente.getId());
    }

    @Transactional
    public void concluir(Integer id) {
        Agenda existente = buscarPorId(id);

        existente.setStatus((short) 3);
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

    public List<Profissional> profissionaisDisponiveis(
            LocalDateTime inicio,
            Integer duracaoMin,
            Integer servicoId,
            Integer excludeAgendaId) {
        LocalDateTime fim = inicio.plusMinutes(duracaoMin);

        List<Profissional> candidatos = catalogoRepo.findProfissionaisByServico(servicoId);

        return candidatos.stream()
                .filter(profissional -> !repo.existsConflitoProfissional(
                        profissional.getId(),
                        inicio,
                        fim,
                        excludeAgendaId))
                .sorted(Comparator.comparing(Profissional::getNome))
                .collect(Collectors.toList());
    }

    private void inativarServicosAgendados(Agenda agenda) {
        List<ServicoAgendado> servicosAgendados = agenda.getServicosAgendados();

        servicosAgendados.forEach(sa -> sa.setStatus((short) 2));
        servicoAgendadoRepo.saveAll(servicosAgendados);
    }

    private void reativarServicosAgendados(Agenda agenda) {
        List<ServicoAgendado> servicosAgendados = agenda.getServicosAgendados();

        servicosAgendados.forEach(sa -> sa.setStatus((short) 1));
        servicoAgendadoRepo.saveAll(servicosAgendados);
    }

    private void validarCriacao(Agenda agenda) {
        if (agenda.getCliente() == null || agenda.getDataHora() == null)
            throw new IllegalArgumentException("Cliente e data/hora são obrigatórios");
    }

    private void validarAtualizacao(Agenda existente, Agenda novo) {
        if (!existente.getCliente().getId().equals(novo.getCliente().getId()))
            throw new IllegalArgumentException("Não é permitido alterar cliente");
    }

}
