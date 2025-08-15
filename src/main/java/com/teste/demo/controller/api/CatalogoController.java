package com.teste.demo.controller.api;

import com.teste.demo.model.Catalogo;
import com.teste.demo.service.CatalogoService;
import com.teste.demo.service.ProfissionalService;
import com.teste.demo.service.ServicoService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/catalogo")
public class CatalogoController {

    private final CatalogoService service;
    private final ProfissionalService profService;
    private final ServicoService servService;

    @GetMapping
    public List<Catalogo> listar() {
        return service.listarAtivos();
    }

    @GetMapping("/{idProfissional}/{idServico}")
    public Catalogo buscar(@PathVariable Integer idProfissional, @PathVariable Integer idServico) {
        return service.buscarPorId(idProfissional, idServico);
    }

    @PostMapping
    public Catalogo criar(@Valid @RequestBody Catalogo catalogo) {
        catalogo.setProfissional(profService.buscarPorId(catalogo.getProfissional().getId()));
        catalogo.setServico(servService.buscarPorId(catalogo.getServico().getId()));
        return service.criar(catalogo);
    }

    @PutMapping("/{idProfissional}/{idServico}")
    public Catalogo atualizar(@PathVariable Integer idProfissional, @PathVariable Integer idServico,
                              @Valid @RequestBody Catalogo catalogo) {
        return service.atualizar(idProfissional, idServico, catalogo);
    }

    @DeleteMapping("/{idProfissional}/{idServico}")
    public void inativar(@PathVariable Integer idProfissional, @PathVariable Integer idServico) {
        service.inativar(idProfissional, idServico);
    }
}
