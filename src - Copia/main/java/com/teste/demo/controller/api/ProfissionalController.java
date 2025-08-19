package com.teste.demo.controller.api;

import com.teste.demo.model.Profissional;
import com.teste.demo.service.ProfissionalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/profissionais")
public class ProfissionalController {

    private final ProfissionalService service;

    @GetMapping
    public ResponseEntity<List<Profissional>> listar(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String telefone,
            @RequestParam(required = false) String email) {
        return ResponseEntity.ok(service.listar(status, nome, telefone, email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Profissional> buscar(@PathVariable Integer id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Profissional> criar(@Valid @RequestBody Profissional body) {
        Profissional criado = service.criar(body);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(criado.getId())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Profissional> atualizar(
            @PathVariable Integer id,
            @Valid @RequestBody Profissional body) {
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
