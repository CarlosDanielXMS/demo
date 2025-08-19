package com.teste.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Table(name = "Profissional")
public class Profissional extends Usuario {

    @NotNull
    @Column(name = "salarioFixo", nullable = false)
    private BigDecimal salarioFixo;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal comissao;

    @OneToMany(mappedBy = "profissional", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("profissional")
    private List<ServicoAgendado> servicosAgendados = new ArrayList<>();

    @OneToMany(mappedBy = "profissional", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("profissional")
    private List<Catalogo> catalogos = new ArrayList<>();
}
