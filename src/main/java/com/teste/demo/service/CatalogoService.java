package com.teste.demo.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.teste.demo.model.Catalogo;
import com.teste.demo.model.CatalogoId;
import com.teste.demo.repository.CatalogoRepository;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
@Transactional(readOnly = true)
public class CatalogoService {

    private final CatalogoRepository repo;

    public List<Catalogo> listarTodos() {
        return repo.findAll();
    }

    public List<Catalogo> listarAtivos() {
        return repo.findByStatus((short) 1);
    }

    public Catalogo buscarPorId(Integer idProfissional, Integer idServico) {
        return repo.findById(new CatalogoId(idProfissional, idServico))
                .orElseThrow(() -> new IllegalArgumentException(
                        "Catálogo não encontrado: " + idProfissional + ", " + idServico));
    }

    @Transactional
    public Catalogo criar(Catalogo catalogo) {
        catalogo.setId(new CatalogoId(
                catalogo.getProfissional().getId(),
                catalogo.getServico().getId()));
        if(catalogo.getTempoMedio() == null) catalogo.setTempoMedio(catalogo.getServico().getTempoMedio());
        if(catalogo.getValor() == null) catalogo.setValor(catalogo.getServico().getValor());
        return repo.save(catalogo);
    }

    @Transactional
    public Catalogo atualizar(Integer idProf, Integer idServ, Catalogo dados) {
        Catalogo existente = buscarPorId(idProf, idServ);
        existente.setValor(dados.getValor());
        existente.setTempoMedio(dados.getTempoMedio());
        return repo.save(existente);
    }

    @Transactional
    public void inativar(Integer idProf, Integer idServ) {
        Catalogo existente = buscarPorId(idProf, idServ);
        existente.setStatus((short) 2);
        repo.save(existente);
    }

    @Transactional
    public void reativar(Integer idProf, Integer idServ) {
        Catalogo existente = buscarPorId(idProf, idServ);
        existente.setStatus((short) 1);
        repo.save(existente);
    }
}
