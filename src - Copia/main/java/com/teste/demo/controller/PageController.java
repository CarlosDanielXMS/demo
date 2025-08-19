package com.teste.demo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.teste.demo.service.ClienteService;
import com.teste.demo.service.ProfissionalService;
import com.teste.demo.service.ServicoService;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;

@Controller
@RequiredArgsConstructor
public class PageController {

    private final ObjectMapper objectMapper;

    private final ClienteService clienteService;
    private final ServicoService servicoService;
    private final ProfissionalService profissionalService;

    @ModelAttribute("apiBase")
    public String apiBase() {
        return "/api/v1";
    }

    @GetMapping("/agendamentos")
    public String agendamentos(Model model) {
        model.addAttribute("activePage", "agendamentos");

        var clientesAtivos = clienteService.listar("1", null, null, null);
        var servicosAtivos = servicoService.listar("1", null, null, null);
        var profissionaisAtivos = profissionalService.listar("1", null, null, null);

        model.addAttribute("clientesJson", toJsonSilencioso(clientesAtivos));
        model.addAttribute("servicosJson", toJsonSilencioso(servicosAtivos));
        model.addAttribute("profissionaisJson", toJsonSilencioso(profissionaisAtivos));

        return "agendamentos";
    }

    @GetMapping("/clientes")
    public String clientes(Model model) {
        model.addAttribute("activePage", "clientes");

        return "clientes";
    }

    @GetMapping("/profissionais")
    public String profissionais(Model model) {
        model.addAttribute("activePage", "profissionais");

        return "profissionais";
    }

    @GetMapping("/servicos")
    public String servicos(Model model) {
        model.addAttribute("activePage", "servicos");

        return "servicos";
    }

    @GetMapping("/catalogo")
    public String catalogo(Model model) {
        model.addAttribute("activePage", "catalogo");

        return "catalogo";
    }

    private String toJsonSilencioso(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return (value instanceof Iterable || value instanceof Object[]) ? "[]" : "{}";
        }
    }
}