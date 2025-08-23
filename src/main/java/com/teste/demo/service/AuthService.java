package com.teste.demo.service;

import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.teste.demo.model.Profissional;
import com.teste.demo.repository.ProfissionalRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class AuthService {

    private final ProfissionalRepository profissionalRepo;

    public Optional<Profissional> autenticar(String email, String senha) {
        return profissionalRepo.findByEmailAndSenha(email, senha);
    }
}
