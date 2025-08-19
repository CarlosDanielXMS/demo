package com.teste.demo.controller.api;

import com.teste.demo.model.ServicoAgendado;
import com.teste.demo.model.ServicoAgendadoId;
import com.teste.demo.service.ServicoAgendadoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/agendamentos/{agendaId}/servicosAgendados")
public class ServicoAgendadoController {

    private final ServicoAgendadoService service;

    @GetMapping
    public ResponseEntity<List<ServicoAgendado>> listar(
            @PathVariable Integer agendaId,
            @RequestParam(required = false) Integer servicoId,
            @RequestParam(required = false) Integer profissionalId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) BigDecimal valorMin) {
        return ResponseEntity.ok(service.listar(agendaId, servicoId, profissionalId, status, valorMin));
    }

    @GetMapping("/{servicoId}/{profissionalId}")
    public ResponseEntity<ServicoAgendado> buscar(
            @PathVariable Integer agendaId,
            @PathVariable Integer servicoId,
            @PathVariable Integer profissionalId) {
        ServicoAgendadoId id = new ServicoAgendadoId(agendaId, servicoId, profissionalId);
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<ServicoAgendado> criar(
            @PathVariable Integer agendaId,
            @Valid @RequestBody ServicoAgendado body) {
        ServicoAgendado criado = service.criar(agendaId, body);
        URI location = URI.create(String.format(
                "/api/v1/agendamentos/%d/servicosAgendados/%d/%d",
                agendaId, criado.getServico().getId(), criado.getProfissional().getId()));
        return ResponseEntity.created(location).body(criado);
    }

    @PutMapping("/{servicoId}/{profissionalId}")
    public ResponseEntity<ServicoAgendado> atualizar(
            @PathVariable Integer agendaId,
            @PathVariable Integer servicoId,
            @PathVariable Integer profissionalId,
            @Valid @RequestBody ServicoAgendado body) {
        ServicoAgendadoId id = new ServicoAgendadoId(agendaId, servicoId, profissionalId);
        return ResponseEntity.ok(service.atualizar(id, body));
    }

    @DeleteMapping("/{servicoId}/{profissionalId}")
    public ResponseEntity<Void> remover(
            @PathVariable Integer agendaId,
            @PathVariable Integer servicoId,
            @PathVariable Integer profissionalId) {
        ServicoAgendadoId id = new ServicoAgendadoId(agendaId, servicoId, profissionalId);
        service.remover(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{servicoId}/{profissionalId}/reativar")
    public ResponseEntity<Void> reativar(
            @PathVariable Integer agendaId,
            @PathVariable Integer servicoId,
            @PathVariable Integer profissionalId) {
        ServicoAgendadoId id = new ServicoAgendadoId(agendaId, servicoId, profissionalId);
        service.reativar(id);
        return ResponseEntity.noContent().build();
    }
}
