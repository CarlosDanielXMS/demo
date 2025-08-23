package com.teste.demo.controller.api;

import com.teste.demo.model.Profissional;
import com.teste.demo.service.AuthService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpSession session) {
        String email = body.get("email");
        String senha = body.get("senha");

        return authService.autenticar(email, senha)
                .map(prof -> {
                    session.setAttribute("usuario", prof);
                    return ResponseEntity.ok(Map.of(
                        "id", prof.getId(),
                        "nome", prof.getNome(),
                        "email", prof.getEmail()
                    ));
                })
                .orElse(ResponseEntity.status(401).body(Map.of("erro", "Credenciais inválidas")));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("mensagem", "Logout realizado"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Profissional prof = (Profissional) session.getAttribute("usuario");
        if (prof == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(Map.of(
            "id", prof.getId(),
            "nome", prof.getNome(),
            "email", prof.getEmail()
        ));
    }
}
