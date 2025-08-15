package com.teste.demo.controller.api;

import com.teste.demo.model.ServicoAgendado;
import com.teste.demo.model.ServicoAgendadoId;
import com.teste.demo.service.ServicoAgendadoService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/servicos-agendados")
public class ServicoAgendadoController {

    private final ServicoAgendadoService service;

    @GetMapping
    public List<ServicoAgendado> listar() {
        return service.listarTodos();
    }

    @GetMapping("/ativos")
    public List<ServicoAgendado> listarAtivos() {
        return service.listarAtivos();
    }

    @GetMapping("/{idAgenda}/{idServico}/{idProfissional}")
    public ServicoAgendado buscarPorId(@PathVariable Integer idAgenda,
                                       @PathVariable Integer idServico,
                                       @PathVariable Integer idProfissional) {
        return service.buscarPorId(new ServicoAgendadoId(idProfissional, idServico, idAgenda));
    }

    @PostMapping
    public ServicoAgendado criar(@RequestBody ServicoAgendado sa) {
        return service.criar(sa);
    }

    @PutMapping
    public ServicoAgendado atualizar(@RequestBody ServicoAgendado sa) {
        return service.atualizar(sa.getId(), sa);
    }

    @DeleteMapping("/{idAgenda}/{idServico}/{idProfissional}")
    public void remover(@PathVariable Integer idAgenda,
                        @PathVariable Integer idServico,
                        @PathVariable Integer idProfissional) {
        service.remover(new ServicoAgendadoId(idProfissional, idServico, idAgenda));
    }
}
