package com.teste.demo.controller.api;

import com.teste.demo.model.Servico;
import com.teste.demo.service.ServicoService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/servicos")
public class ServicoController {

    private final ServicoService service;

    @GetMapping
    public List<Servico> listar() {
        return service.listarAtivos();
    }

    @GetMapping("/{id}")
    public Servico buscar(@PathVariable Integer id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public Servico criar(@Valid @RequestBody Servico servico) {
        return service.criar(servico);
    }

    @PutMapping("/{id}")
    public Servico atualizar(@PathVariable Integer id, @Valid @RequestBody Servico servico) {
        return service.atualizar(id, servico);
    }

    @DeleteMapping("/{id}")
    public void inativar(@PathVariable Integer id) {
        service.inativar(id);
    }
}
