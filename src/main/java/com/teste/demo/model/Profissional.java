package com.teste.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "Profissional")
public class Profissional extends Usuario {

    @NotNull
    @Column(name = "salarioFixo", nullable = false)
    private BigDecimal salarioFixo;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal comissao;

    @OneToMany(mappedBy = "profissional", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonBackReference("profissional-servicosAgendados")
    private List<ServicoAgendado> servicosAgendados;

    @OneToMany(mappedBy = "profissional", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("profissional-catalogos")
    private List<Catalogo> catalogos;
}
