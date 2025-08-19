package com.teste.demo.controller.api;

import com.teste.demo.model.Servico;
import com.teste.demo.service.ServicoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/servicos")
public class ServicoController {

    private final ServicoService service;

    @GetMapping
    public ResponseEntity<List<Servico>> listar(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String descricao,
            @RequestParam(required = false) Integer tempoMedioMin,
            @RequestParam(required = false) BigDecimal valorMin) {
        return ResponseEntity.ok(service.listar(status, descricao, tempoMedioMin, valorMin));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Servico> buscar(@PathVariable Integer id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Servico> criar(@Valid @RequestBody Servico body) {
        Servico criado = service.criar(body);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(criado.getId())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Servico> atualizar(
            @PathVariable Integer id,
            @Valid @RequestBody Servico body) {
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
}
