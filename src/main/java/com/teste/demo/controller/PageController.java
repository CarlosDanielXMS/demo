package com.teste.demo.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;

@Controller
@RequiredArgsConstructor
public class PageController {

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

    @GetMapping("/relatorios")
    public String relatorios(HttpSession session, Model model) {
        if (session.getAttribute("usuario") == null)
            return "redirect:/login";

        model.addAttribute("activePage", "relatorios");

        return "relatorios";
    }
}