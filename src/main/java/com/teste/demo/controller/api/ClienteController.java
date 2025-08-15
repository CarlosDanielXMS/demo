package com.teste.demo.controller.api;

import com.teste.demo.model.Cliente;
import com.teste.demo.service.ClienteService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService service;

    @GetMapping
    public List<Cliente> listar() {
        return service.listarTodos();
    }

    @GetMapping("/{id}")
    public Cliente buscar(@PathVariable Integer id) {
        return service.buscarPorId(id);
    }

    @PostMapping
    public Cliente criar(@RequestBody Cliente cliente) {
        return service.criar(cliente);
    }

    @PutMapping("/{id}")
    public Cliente atualizar(@PathVariable Integer id, @Valid @RequestBody Cliente cliente) {
        return service.atualizar(id, cliente);
    }

    @DeleteMapping("/{id}")
    public void inativar(@PathVariable Integer id) {
        service.inativar(id);
    }
}
