package com.teste.demo.controller.api;

import com.teste.demo.model.Agenda;
import com.teste.demo.model.Profissional;
import com.teste.demo.service.AgendaService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/agendamentos")
public class AgendaController {

    private final AgendaService service;

    @GetMapping
    public ResponseEntity<List<Agenda>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam(required = false) Integer clienteId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer tempoTotalMin,
            @RequestParam(required = false) BigDecimal valorTotalMin) {
        return ResponseEntity.ok(service.listar(data, clienteId, status, tempoTotalMin, valorTotalMin));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Agenda> buscar(@PathVariable Integer id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Agenda> criar(@Valid @RequestBody Agenda body) {
        Agenda criado = service.criar(body);
        URI location = URI.create("/api/v1/agendamentos/" + criado.getId());
        return ResponseEntity.created(location).body(criado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Agenda> atualizar(
            @PathVariable Integer id,
            @Valid @RequestBody Agenda body) {
        return ResponseEntity.ok(service.atualizar(id, body));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> inativar(@PathVariable Integer id) {
        service.inativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/reativar")
    public ResponseEntity<Void> reativar(@PathVariable Integer id) {
        service.reativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/concluir")
    public ResponseEntity<Void> concluir(@PathVariable Integer id) {
        service.concluir(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/profissionais-disponiveis")
    public ResponseEntity<List<Profissional>> profissionaisDisponiveis(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam Integer duracaoMin,
            @RequestParam Integer servicoId,
            @RequestParam(required = false) Integer agendaId) {
        return ResponseEntity.ok(
                service.profissionaisDisponiveis(inicio, duracaoMin, servicoId));
    }
}