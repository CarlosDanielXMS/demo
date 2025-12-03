package com.teste.demo.controller.api;

import com.teste.demo.model.Catalogo;
import com.teste.demo.model.CatalogoId;
import com.teste.demo.service.CatalogoService;
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
@RequestMapping("/api/v1/catalogos")
public class CatalogoController {

    private final CatalogoService service;

    @GetMapping
    public ResponseEntity<List<Catalogo>> listar(
            @RequestParam(required = false) Integer profissionalId,
            @RequestParam(required = false) Integer servicoId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer tempoMedioMin,
            @RequestParam(required = false) BigDecimal valorMin) {
        return ResponseEntity.ok(service.listar(profissionalId, servicoId, status, tempoMedioMin, valorMin));
    }

    @GetMapping("/{profissionalId}/{servicoId}")
    public ResponseEntity<Catalogo> buscar(
            @PathVariable Integer profissionalId,
            @PathVariable Integer servicoId) {
        CatalogoId id = new CatalogoId(profissionalId, servicoId);
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Catalogo> criar(@Valid @RequestBody Catalogo body) {
        Catalogo criado = service.criar(body);
        CatalogoId id = criado.getId();
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{profissionalId}/{servicoId}")
                .buildAndExpand(id.getIdProfissional(), id.getIdServico())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }

    @PutMapping("/{profissionalId}/{servicoId}")
    public ResponseEntity<Catalogo> atualizar(
            @PathVariable Integer profissionalId,
            @PathVariable Integer servicoId,
            @Valid @RequestBody Catalogo body) {
        CatalogoId id = new CatalogoId(profissionalId, servicoId);
        return ResponseEntity.ok(service.atualizar(id, body));
    }

    @DeleteMapping("/{profissionalId}/{servicoId}")
    public ResponseEntity<Void> inativar(
            @PathVariable Integer profissionalId,
            @PathVariable Integer servicoId) {
        CatalogoId id = new CatalogoId(profissionalId, servicoId);
        service.inativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{profissionalId}/{servicoId}/reativar")
    public ResponseEntity<Void> reativar(
            @PathVariable Integer profissionalId,
            @PathVariable Integer servicoId) {
        CatalogoId id = new CatalogoId(profissionalId, servicoId);
        service.reativar(id);
        return ResponseEntity.noContent().build();
    }
}
