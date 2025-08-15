package com.teste.demo.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teste.demo.model.Catalogo;
import com.teste.demo.model.Cliente;
import com.teste.demo.model.Profissional;
import com.teste.demo.model.Servico;
import com.teste.demo.service.CatalogoService;
import com.teste.demo.service.ClienteService;
import com.teste.demo.service.ProfissionalService;
import com.teste.demo.service.ServicoService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@AllArgsConstructor
public class PageController {

    private final ClienteService clienteService;
    private final ServicoService servicoService;
    private final ProfissionalService profissionalService;
    private final CatalogoService catalogoService;
    private final ObjectMapper objectMapper;

    private String toJsonSafe(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    @GetMapping({"/", "/agendamentos"})
    public String agendamentos(Model model) {
        var clientes = clienteService.listarAtivos();
        var servicos = servicoService.listarAtivos();
        var profs = profissionalService.listarAtivos();

        model.addAttribute("activePage", "agendamentos");

        model.addAttribute("clientes", clientes);
        model.addAttribute("servicos", servicos);
        model.addAttribute("profissionais", profs);
        model.addAttribute("novoAgenda", new Object());

        model.addAttribute("clientesJson", toJsonSafe(clientes));
        model.addAttribute("servicosJson", toJsonSafe(servicos));
        model.addAttribute("profissionaisJson", toJsonSafe(profs));

        return "agendamentos";
    }

    @GetMapping("/clientes")
    public String clientes(Model model) {
        var list = clienteService.listarAtivos();

        model.addAttribute("activePage", "clientes");

        model.addAttribute("clientes", list);
        model.addAttribute("novoCliente", new Cliente());
        model.addAttribute("clientesJson", toJsonSafe(list));
        return "clientes";
    }

    @GetMapping("/profissionais")
    public String profissionais(Model model) {
        var list = profissionalService.listarAtivos();

        model.addAttribute("activePage", "profissionais");

        model.addAttribute("profissionais", list);
        model.addAttribute("novoProfissional", new Profissional());
        model.addAttribute("profissionaisJson", toJsonSafe(list));
        return "profissionais";
    }

    @GetMapping("/servicos")
    public String servicos(Model model) {
        var list = servicoService.listarAtivos();

        model.addAttribute("activePage", "servicos");

        model.addAttribute("servicos", list);
        model.addAttribute("novoServico", new Servico());
        model.addAttribute("servicosJson", toJsonSafe(list));
        return "servicos";
    }

    @GetMapping("/catalogo")
    public String catalogo(Model model) {
        var list = catalogoService.listarAtivos();
        var profs = profissionalService.listarAtivos();
        var servs = servicoService.listarAtivos();

        model.addAttribute("activePage", "catalogo");

        model.addAttribute("catalogo", list);
        model.addAttribute("novoCatalogo", new Catalogo());
        model.addAttribute("profissionais", profs);
        model.addAttribute("servicos", servs);

        model.addAttribute("catalogoJson", toJsonSafe(list));
        model.addAttribute("profissionaisJson", toJsonSafe(profs));
        model.addAttribute("servicosJson", toJsonSafe(servs));

        return "catalogo";
    }
}
