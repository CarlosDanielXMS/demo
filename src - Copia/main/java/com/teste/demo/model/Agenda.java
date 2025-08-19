package com.teste.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
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
@Table(name = "Agenda")
public class Agenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idCliente", nullable = false)
    @JsonIgnoreProperties("agendas")
    private Cliente cliente;

    @NotNull
    @Column(name = "dataHora", nullable = false)
    private LocalDateTime dataHora;

    @Min(0)
    @Column(name = "tempoTotal", nullable = false)
    private Integer tempoTotal = 0;

    @DecimalMin("0.00")
    @Column(name = "valorTotal", nullable = false)
    private BigDecimal valorTotal = BigDecimal.ZERO;

    @NotNull
    @Min(1)
    @Max(3)
    @Column(nullable = false)
    private Short status = 1;

    @OneToMany(mappedBy = "agenda", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("agenda")
    private List<ServicoAgendado> servicosAgendados = new ArrayList<>();
}
