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

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Table(name = "Servico")
public class Servico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank
    @Column(nullable = false, length = 50, unique = true)
    private String descricao;

    @NotNull
    @DecimalMin("0.01")
    @Column(nullable = false)
    private BigDecimal valor;

    @NotNull
    @Min(1)
    @Column(name = "tempoMedio", nullable = false)
    private Integer tempoMedio;

    @NotNull
    @Min(1) @Max(2)
    @Column(nullable = false)
    private Short status = 1;

    @OneToMany(mappedBy = "servico", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonBackReference("servico-servicosAgendados")
    private List<ServicoAgendado> servicosAgendados;

    @OneToMany(mappedBy = "servico", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonBackReference("servico-catalogos")
    private List<Catalogo> catalogos;
}
