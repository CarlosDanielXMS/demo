package com.teste.demo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.teste.demo.service.ClienteService;
import com.teste.demo.service.ProfissionalService;
import com.teste.demo.service.ServicoService;

import jakarta.servlet.http.HttpSession;
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

    @GetMapping("/login")
    public String loginPage(HttpSession session) {
        if (session.getAttribute("usuario") != null) {
            return "redirect:/agendamentos";
        }
        return "login";
    }

    @GetMapping("/agendamentos")
    public String agendamentos(HttpSession session, Model model) {
        if (session.getAttribute("usuario") == null)
            return "redirect:/login";

        model.addAttribute("activePage", "agendamentos");

        var clientesAtivos = clienteService.listar("1", null, null, null);
        var servicosAtivos = servicoService.listar("1", null, null, null);
        var profissionaisAtivos = profissionalService.listar("1", null, null, null);

        model.addAttribute("clientesJson", toJson(clientesAtivos));
        model.addAttribute("servicosJson", toJson(servicosAtivos));
        model.addAttribute("profissionaisJson", toJson(profissionaisAtivos));

        return "agendamentos";
    }

    @GetMapping("/clientes")
    public String clientes(HttpSession session, Model model) {
        if (session.getAttribute("usuario") == null)
            return "redirect:/login";

        model.addAttribute("activePage", "clientes");

        return "clientes";
    }

    @GetMapping("/profissionais")
    public String profissionais(HttpSession session, Model model) {
        if (session.getAttribute("usuario") == null)
            return "redirect:/login";

        model.addAttribute("activePage", "profissionais");

        return "profissionais";
    }

    @GetMapping("/servicos")
    public String servicos(HttpSession session, Model model) {
        if (session.getAttribute("usuario") == null)
            return "redirect:/login";

        model.addAttribute("activePage", "servicos");

        return "servicos";
    }

    @GetMapping("/catalogo")
    public String catalogo(HttpSession session, Model model) {
        if (session.getAttribute("usuario") == null)
            return "redirect:/login";

        model.addAttribute("activePage", "catalogo");

        return "catalogo";
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return (value instanceof Iterable || value instanceof Object[]) ? "[]" : "{}";
        }
    }
}