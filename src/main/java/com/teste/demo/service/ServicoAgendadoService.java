package com.teste.demo.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.teste.demo.model.CatalogoId;
import com.teste.demo.model.ServicoAgendado;
import com.teste.demo.model.ServicoAgendadoId;
import com.teste.demo.repository.CatalogoRepository;
import com.teste.demo.repository.ServicoAgendadoRepository;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
@Transactional(readOnly = true)
public class ServicoAgendadoService {

    private final ServicoAgendadoRepository repo;
    private final CatalogoRepository catalogoRepo;

    public List<ServicoAgendado> listarTodos() {
        return repo.findAll();
    }

    public List<ServicoAgendado> listarAtivos() {
        return repo.findByStatus((short) 1);
    }

    public ServicoAgendado buscarPorId(ServicoAgendadoId id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ServicoAgendado não encontrado: " + id));
    }

    private void verificarDisponibilidade(ServicoAgendado novo) {
        if (novo.getAgenda() == null || novo.getAgenda().getDataHora() == null) {
            throw new IllegalArgumentException("Agenda ou dataHora da agenda não informada.");
        }

        int minutosAcumulados = minutosAntesDoServico(novo);

        CatalogoId cidNovo = new CatalogoId(novo.getProfissional().getId(), novo.getServico().getId());
        int tempoNovo = catalogoRepo.findById(cidNovo)
                .map(c -> c.getTempoMedio() != null ? c.getTempoMedio() : 0)
                .orElse(0);

        LocalDateTime inicioNovo = novo.getAgenda().getDataHora().plusMinutes(minutosAcumulados);
        LocalDateTime fimNovo = inicioNovo.plusMinutes(tempoNovo);

        List<ServicoAgendado> ativos = repo.findByStatus((short) 1);

        for (ServicoAgendado existente : ativos) {
            if (existente.getProfissional() == null || existente.getAgenda() == null) continue;
            if (!existente.getProfissional().getId().equals(novo.getProfissional().getId())) continue;

            if (novo.getAgenda().getId() != null && existente.getAgenda().getId() != null
                    && novo.getAgenda().getId().equals(existente.getAgenda().getId())) {
            }

            int minutosAntesExistente = minutosAntesDoServico(existente);
            CatalogoId cidExistente = new CatalogoId(existente.getProfissional().getId(), existente.getServico().getId());
            int tempoExistente = catalogoRepo.findById(cidExistente)
                    .map(c -> c.getTempoMedio() != null ? c.getTempoMedio() : 0)
                    .orElse(0);

            LocalDateTime inicioExistente = existente.getAgenda().getDataHora().plusMinutes(minutosAntesExistente);
            LocalDateTime fimExistente = inicioExistente.plusMinutes(tempoExistente);

            boolean sobreposicao = inicioNovo.isBefore(fimExistente) && fimNovo.isAfter(inicioExistente);
            if (sobreposicao) {
                throw new IllegalArgumentException("Profissional " + novo.getProfissional().getId()
                        + " indisponível entre " + inicioExistente + " e " + fimExistente);
            }
        }
    }

    private int minutosAntesDoServico(ServicoAgendado alvo) {
        int soma = 0;
        var servicos = alvo.getAgenda().getServicosAgendados();
        if (servicos == null || servicos.isEmpty()) return 0;

        int idx = servicos.indexOf(alvo);
        int limite = (idx >= 0) ? idx : servicos.size();

        for (int i = 0; i < limite; i++) {
            ServicoAgendado s = servicos.get(i);
            if (s.getStatus() != null && s.getStatus() == 1) {
                CatalogoId cid = new CatalogoId(s.getProfissional().getId(), s.getServico().getId());
                soma += catalogoRepo.findById(cid)
                        .map(c -> c.getTempoMedio() != null ? c.getTempoMedio() : 0)
                        .orElse(0);
            }
        }
        return soma;
    }

    @Transactional
    public ServicoAgendado criar(ServicoAgendado servicoAgendado) {
        CatalogoId catalogoId = new CatalogoId(
                servicoAgendado.getProfissional().getId(),
                servicoAgendado.getServico().getId());

        if(!catalogoRepo.existsByIdAndStatus(catalogoId, (short) 1)){
            throw new IllegalArgumentException("Catálogo não encontrado para profissional " +
                    servicoAgendado.getProfissional().getId() +
                    " e serviço " +
                    servicoAgendado.getServico().getId());
        }

        verificarDisponibilidade(servicoAgendado);

        servicoAgendado.setId(new ServicoAgendadoId(
                servicoAgendado.getProfissional().getId(),
                servicoAgendado.getServico().getId(),
                servicoAgendado.getAgenda().getId()));

        if (servicoAgendado.getValor() == null) {
            servicoAgendado.setValor(catalogoRepo.findById(catalogoId).get().getValor());
        }
        
        return repo.save(servicoAgendado);
    }

    @Transactional
    public ServicoAgendado atualizar(ServicoAgendadoId id, ServicoAgendado dados) {
        ServicoAgendado existente = buscarPorId(id);
        existente.setValor(dados.getValor());
        existente.setStatus(dados.getStatus());
        return repo.save(existente);
    }

    @Transactional
    public void inativar(ServicoAgendadoId id) {
        ServicoAgendado existente = buscarPorId(id);
        existente.setStatus((short) 2);
        repo.save(existente);
    }

    @Transactional
    public void reativar(ServicoAgendadoId id) {
        ServicoAgendado existente = buscarPorId(id);
        existente.setStatus((short) 1);
        repo.save(existente);
    }

    @Transactional
    public void remover(ServicoAgendadoId id) {
        ServicoAgendado existente = buscarPorId(id);
        repo.delete(existente);
    }
}
