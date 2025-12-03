package com.teste.demo.service;

import com.teste.demo.model.Cliente;
import com.teste.demo.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class ClienteService {

    private final ClienteRepository repo;

    public List<Cliente> listar(String status, String nome, String telefone, String email) {
        Short st = parseStatus(status);
        return repo.filtrarClientes(
                st,
                StringUtils.hasText(nome) ? nome : null,
                StringUtils.hasText(telefone) ? telefone : null,
                StringUtils.hasText(email) ? email : null);
    }

    public Cliente buscarPorId(Integer id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado: " + id));
    }

    @Transactional
    public Cliente criar(Cliente body) {
        sanitizeClienteData(body);
        if (body.getStatus() == null)
            body.setStatus((short) 1);
        return repo.save(body);
    }

    @Transactional
    public Cliente atualizar(Integer id, Cliente body) {
        Cliente existente = buscarPorId(id);
        sanitizeClienteData(body);

        body.setId(existente.getId());
        if (body.getStatus() == null)
            body.setStatus(existente.getStatus());

        return repo.save(body);
    }

    @Transactional
    public void inativar(Integer id) {
        repo.deleteById(id);
    }

    @Transactional
    public void reativar(Integer id) {
        repo.findById(id).ifPresent(cliente -> {
            cliente.setStatus((short) 1);
            repo.save(cliente);
        });
    }

    private Short parseStatus(String s) {
        if (!StringUtils.hasText(s))
            return null;
        if ("ATIVO".equalsIgnoreCase(s))
            return 1;
        if ("INATIVO".equalsIgnoreCase(s))
            return 2;
        try {
            return Short.parseShort(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void sanitizeClienteData(Cliente cliente) {
        Optional.ofNullable(cliente.getNome()).ifPresent(nome -> cliente.setNome(nome.trim()));

        Optional.ofNullable(cliente.getTelefone()).ifPresent(tel -> cliente.setTelefone(tel.replaceAll("[^0-9]", "")));

        Optional.ofNullable(cliente.getEmail()).ifPresent(email -> cliente.setEmail(email.trim().toLowerCase()));
    }
}
