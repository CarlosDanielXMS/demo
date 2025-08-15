package com.teste.demo.service;

import com.teste.demo.model.*;
import com.teste.demo.repository.AgendaRepository;
import com.teste.demo.repository.CatalogoRepository;
import com.teste.demo.repository.ServicoAgendadoRepository;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@AllArgsConstructor
@Service
@Transactional(readOnly = true)
public class AgendaService {

    private final AgendaRepository repo;
    private final CatalogoRepository catalogoRepo;
    private final ServicoAgendadoService servicoAgendadoService;
    private final ServicoAgendadoRepository servicoAgendadoRepo;

    public List<Agenda> listarTodos() {
        return repo.findAll();
    }

    public List<Agenda> listarAtivos() {
        return repo.findByStatus((short) 1);
    }

    public Agenda buscarPorId(Integer id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Agenda não encontrada: " + id));
    }

    public void recalcularTotais(Integer agendaId) {
        Agenda a = buscarPorId(agendaId);
        int tempoTotal = 0;
        BigDecimal valorTotal = BigDecimal.ZERO;
        if (a.getServicosAgendados() != null) {
            for (ServicoAgendado sa : a.getServicosAgendados()) {
                if (sa.getStatus() != null && sa.getStatus() == 1) {
                    CatalogoId cid = new CatalogoId(sa.getProfissional().getId(), sa.getServico().getId());
                    catalogoRepo.findById(cid).ifPresent(c -> {
                    });
                    var catOpt = catalogoRepo.findById(cid);
                    if (catOpt.isPresent()) {
                        var cat = catOpt.get();
                        if (cat.getTempoMedio() != null) tempoTotal += cat.getTempoMedio();
                        if (cat.getValor() != null) valorTotal = valorTotal.add(cat.getValor());
                    }
                }
            }
        }
        a.setTempoTotal(tempoTotal);
        a.setValorTotal(valorTotal);
        repo.save(a);
    }

    @Transactional
    public Agenda criar(Agenda agenda) {
        if (agenda.getServicosAgendados() == null) {
            agenda.setServicosAgendados(java.util.Collections.emptyList());
        }

        agenda.setTempoTotal(0);
        agenda.setValorTotal(BigDecimal.ZERO);
        Agenda salvo = repo.save(agenda);

        for (ServicoAgendado sa : new java.util.ArrayList<>(salvo.getServicosAgendados())) {
            sa.setAgenda(salvo);
            servicoAgendadoService.criar(sa);
        }

        recalcularTotais(salvo.getId());
        return repo.findById(salvo.getId()).get();
    }

    @Transactional
    public Agenda atualizar(Agenda agenda) {
        Agenda existente = buscarPorId(agenda.getId());

        existente.setCliente(agenda.getCliente());
        existente.setDataHora(agenda.getDataHora());
        existente.setStatus(agenda.getStatus());

        List<ServicoAgendado> incoming = agenda.getServicosAgendados() == null ? java.util.List.of() : agenda.getServicosAgendados();
        List<ServicoAgendado> current = existente.getServicosAgendados() == null ? java.util.List.of() : new java.util.ArrayList<>(existente.getServicosAgendados());

        java.util.Map<ServicoAgendadoId, ServicoAgendado> currentMap = new java.util.HashMap<>();
        for (ServicoAgendado s : current) {
            if (s.getId() != null) currentMap.put(s.getId(), s);
        }

        for (ServicoAgendado sa : incoming) {
            sa.setAgenda(existente);
            if (sa.getId() == null || sa.getId().getIdAgenda() == null) {
                servicoAgendadoService.criar(sa);
            } else if (currentMap.containsKey(sa.getId())) {
                servicoAgendadoService.atualizar(sa.getId(), sa);
                currentMap.remove(sa.getId());
            } else {
                servicoAgendadoService.criar(sa);
            }
        }

        for (ServicoAgendadoId idRemover : currentMap.keySet()) {
            servicoAgendadoRepo.deleteById(idRemover);
        }

        Agenda salvo = repo.save(existente);
        recalcularTotais(salvo.getId());
        return repo.findById(salvo.getId()).get();
    }

    @Transactional
    public void inativar(Integer id) {
        Agenda existente = buscarPorId(id);
        existente.setStatus((short) 2);
        if (existente.getServicosAgendados() != null) {
            for (ServicoAgendado sa : existente.getServicosAgendados()) {
                servicoAgendadoService.inativar(sa.getId());
            }
        }
        repo.save(existente);
    }

    @Transactional
    public void reativar(Integer id) {
        Agenda existente = buscarPorId(id);
        existente.setStatus((short) 1);
        if (existente.getServicosAgendados() != null) {
            for (ServicoAgendado sa : existente.getServicosAgendados()) {
                servicoAgendadoService.reativar(sa.getId());
            }
        }
        repo.save(existente);
    }
}
