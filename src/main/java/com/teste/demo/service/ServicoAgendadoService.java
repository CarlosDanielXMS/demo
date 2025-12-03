package com.teste.demo.service;

import com.teste.demo.model.Agenda;
import com.teste.demo.model.Catalogo;
import com.teste.demo.model.CatalogoId;
import com.teste.demo.model.ServicoAgendado;
import com.teste.demo.model.ServicoAgendadoId;
import com.teste.demo.repository.AgendaRepository;
import com.teste.demo.repository.CatalogoRepository;
import com.teste.demo.repository.ServicoAgendadoRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class ServicoAgendadoService {

    private final ServicoAgendadoRepository repo;
    private final AgendaRepository agendaRepo;
    private final CatalogoRepository catalogoRepo;
    private final AgendaService agendaService;

    public List<ServicoAgendado> listar(Integer agendaId, Integer servicoId, Integer profissionalId, String status,
            BigDecimal valorMin) {
        Short st = parseStatus(status);
        return repo.filtrarServicosAgendados(agendaId, servicoId, profissionalId, st, valorMin);
    }

    public ServicoAgendado buscarPorId(ServicoAgendadoId id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Serviço agendado não encontrado: " + id));
    }

    @Transactional
    public ServicoAgendado criar(Integer agendaId, ServicoAgendado body) {
        Agenda agenda = agendaRepo.findByIdWithServicos(agendaId)
                .orElseThrow(() -> new IllegalArgumentException("Agenda não encontrada"));

        validarCriacao(agenda, body);
        configurarServico(agendaId, body);
        verificarConflitos(agenda, body);

        ServicoAgendado salvo = repo.save(body);

        agenda.getServicosAgendados().add(salvo);

        agendaService.recalcularTotais(agenda.getId());
        return salvo;
    }

    @Transactional
    public ServicoAgendado atualizar(ServicoAgendadoId id, ServicoAgendado body) {
        ServicoAgendado existente = buscarPorId(id);

        // Atualiza apenas valor e status do serviço agendado
        if (body.getValor() != null) {
            existente.setValor(body.getValor());
        }
        if (body.getStatus() != null) {
            existente.setStatus(body.getStatus());
        }

        // Detecta mudança de serviço ou profissional
        boolean mudouServicoOuProfissional = false;
        Integer novoProfissionalId = existente.getProfissional().getId();
        Integer novoServicoId = existente.getServico().getId();

        if (body.getProfissional() != null && body.getProfissional().getId() != null
                && !body.getProfissional().getId().equals(novoProfissionalId)) {
            novoProfissionalId = body.getProfissional().getId();
            mudouServicoOuProfissional = true;
        }

        if (body.getServico() != null && body.getServico().getId() != null
                && !body.getServico().getId().equals(novoServicoId)) {
            novoServicoId = body.getServico().getId();
            mudouServicoOuProfissional = true;
        }

        if (mudouServicoOuProfissional) {
            // Busca catálogo do novo serviço/profissional
            Catalogo catalogo = catalogoRepo.findById(new CatalogoId(novoProfissionalId, novoServicoId))
                    .orElseThrow(() -> new IllegalArgumentException("Catálogo não encontrado"));

            if (catalogo.getStatus() != 1) {
                throw new IllegalStateException("Catálogo inativo");
            }

            // Atualiza referência do serviço e profissional
            existente.setProfissional(body.getProfissional());
            existente.setServico(body.getServico());

            // Atualiza ID composto
            ServicoAgendadoId novoId = new ServicoAgendadoId(
                    existente.getAgenda().getId(),
                    novoServicoId,
                    novoProfissionalId);
            existente.setId(novoId);

            // Verifica disponibilidade e conflitos usando tempo do catálogo
            Agenda agenda = existente.getAgenda();
            LocalDateTime inicioServico = calcularInicioDoServicoNaAgenda(agenda, existente);
            LocalDateTime fimServico = inicioServico.plusMinutes(
                    Optional.ofNullable(catalogo.getTempoMedio())
                            .orElse(catalogo.getServico().getTempoMedio()));
            verificarDisponibilidadeProfissional(novoProfissionalId, inicioServico, fimServico, novoId);
            verificarConflitos(agenda, existente);
        }

        // Persiste alterações e recalcula totais
        ServicoAgendado salvo = repo.save(existente);
        agendaService.recalcularTotais(existente.getAgenda().getId());
        return salvo;
    }

    @Transactional
    public void remover(ServicoAgendadoId id) {
        ServicoAgendado existente = buscarPorId(id);
        Agenda agenda = existente.getAgenda();

        if (existente.getStatus() != 2) {
            throw new IllegalStateException(
                    "Serviço agendado deve estar inativo para ser removido fisicamente");
        }

        if (agenda == null || agenda.getStatus() != 1) {
            throw new IllegalStateException(
                    "A agenda associada deve estar ativa para remoção física");
        }

        repo.delete(existente);

        agendaService.recalcularTotais(agenda.getId());
    }

    @Transactional
    public void inativar(ServicoAgendadoId id) {
        ServicoAgendado existente = buscarPorId(id);

        repo.deleteById(id);

        Agenda a = existente.getAgenda();
        agendaService.recalcularTotais(a.getId());
    }

    @Transactional
    public void reativar(ServicoAgendadoId id) {
        ServicoAgendado existente = buscarPorId(id);
        existente.setStatus((short) 1);
        repo.save(existente);

        Agenda a = existente.getAgenda();
        if (a != null && a.getId() != null) {
            agendaService.recalcularTotais(a.getId());
        }
    }

    private LocalDateTime calcularInicioDoServicoNaAgenda(Agenda agenda, ServicoAgendado novo) {
        int tempoTotalAnterior = 0;

        for (ServicoAgendado sa : agenda.getServicosAgendados()) {
            if (sa.getStatus() != 1)
                continue;
            if (sa.equals(novo))
                break;

            Catalogo catalogo = catalogoRepo
                    .findById(new CatalogoId(sa.getProfissional().getId(), sa.getServico().getId()))
                    .orElseThrow(() -> new IllegalArgumentException("Catálogo não encontrado"));

            tempoTotalAnterior += Optional.ofNullable(catalogo.getTempoMedio())
                    .orElse(catalogo.getServico().getTempoMedio());
        }

        return agenda.getDataHora().plusMinutes(tempoTotalAnterior);
    }

    private void verificarDisponibilidadeProfissional(Integer profissionalId, LocalDateTime inicio, LocalDateTime fim,
            ServicoAgendadoId ignorar) {

        List<ServicoAgendado> servicos = repo.findByProfissionalIdAndStatus(profissionalId, (short) 1);
        for (ServicoAgendado sa : servicos) {
            if (ignorar != null && ignorar.equals(sa.getId())) {
                continue;
            }

            Agenda agenda = sa.getAgenda();
            if (agenda == null || agenda.getStatus() != 1) {
                continue;
            }

            LocalDateTime inicioSa = calcularInicioDoServicoNaAgenda(agenda, sa);
            CatalogoId catId = new CatalogoId(sa.getProfissional().getId(), sa.getServico().getId());
            Catalogo catalogo = catalogoRepo.findById(catId)
                    .orElseThrow(() -> new IllegalArgumentException("Catálogo não encontrado"));
            LocalDateTime fimSa = inicioSa.plusMinutes(
                    Optional.ofNullable(catalogo.getTempoMedio())
                            .orElseGet(() -> catalogo.getServico().getTempoMedio()));

            if (sobrepoe(inicio, fim, inicioSa, fimSa)) {
                throw new IllegalStateException(
                        "Profissional já possui serviço agendado no período: " + inicioSa + " - " + fimSa);
            }
        }
    }

    private boolean sobrepoe(LocalDateTime inicio1, LocalDateTime fim1, LocalDateTime inicio2, LocalDateTime fim2) {
        return inicio1.isBefore(fim2) && fim1.isAfter(inicio2);
    }

    private Short parseStatus(String s) {
        if (s == null || s.isBlank())
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

    private void validarCriacao(Agenda agenda, ServicoAgendado servico) {
        if (agenda.getStatus() != 1)
            throw new IllegalStateException("Agenda inativa");
        if (servico.getServico() == null || servico.getProfissional() == null)
            throw new IllegalArgumentException("Serviço e profissional são obrigatórios");
    }

    private void configurarServico(Integer agendaId, ServicoAgendado servico) {
        ServicoAgendadoId id = new ServicoAgendadoId(
                agendaId,
                servico.getServico().getId(),
                servico.getProfissional().getId());
        servico.setId(id);

        Agenda agendaRef = new Agenda();
        agendaRef.setId(agendaId);
        servico.setAgenda(agendaRef);

        Catalogo catalogo = catalogoRepo.findById(new CatalogoId(
                servico.getProfissional().getId(),
                servico.getServico().getId()))
                .orElseThrow(() -> new IllegalArgumentException("Catálogo não encontrado"));

        if (servico.getValor() == null)
            servico.setValor(Optional.ofNullable(catalogo.getValor()).orElse(catalogo.getServico().getValor()));

        if (servico.getStatus() == null)
            servico.setStatus((short) 1);
    }

    private void verificarConflitos(Agenda agenda, ServicoAgendado servico) {
        Catalogo catalogo = catalogoRepo.findById(new CatalogoId(
                servico.getProfissional().getId(),
                servico.getServico().getId()))
                .orElseThrow();

        LocalDateTime inicioServico = agenda.getDataHora();
        LocalDateTime fimServico = inicioServico.plusMinutes(
                Optional.ofNullable(catalogo.getTempoMedio()).orElse(catalogo.getServico().getTempoMedio()));

        if (agendaRepo.existsConflitoProfissional(
                servico.getProfissional().getId(),
                inicioServico,
                fimServico,
                agenda.getId())) {
            throw new IllegalArgumentException("Conflito de agendamento para profissional");
        }
    }
}