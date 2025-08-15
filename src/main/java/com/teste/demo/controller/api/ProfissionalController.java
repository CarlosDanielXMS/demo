package com.teste.demo.controller.api;

import com.teste.demo.model.Profissional;
import com.teste.demo.service.ProfissionalService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/profissionais")
public class ProfissionalController {

    private final ProfissionalService service;

    @GetMapping
    public List<Profissional> listar() {
        return service.listarAtivos();
    }

    @GetMapping("/{id}")
    public Profissional buscar(@PathVariable Integer id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public Profissional criar(@Valid @RequestBody Profissional prof) {
        return service.criar(prof);
    }

    @PutMapping("/{id}")
    public Profissional atualizar(@PathVariable Integer id, @Valid @RequestBody Profissional prof) {
        return service.atualizar(id, prof);
    }

    @DeleteMapping("/{id}")
    public void inativar(@PathVariable Integer id) {
        service.inativar(id);
    }
}
