package com.teste.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import jakarta.servlet.http.HttpSession;

@Controller
public class HomeController {

    @GetMapping("/")
    public String homePage(HttpSession session, Model model) {
        if (session.getAttribute("usuario") == null) return "login";
        return "redirect:/agendamentos";
    }
}
