package com.teste.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Table(name = "Servico_Agendado")
public class ServicoAgendado {

    @EmbeddedId
    private ServicoAgendadoId id;

    @MapsId("idAgenda")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idAgenda", nullable = false)
    @JsonIgnoreProperties("servicosAgendados")
    private Agenda agenda;

    @MapsId("idServico")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idServico", nullable = false)
    @JsonIgnoreProperties("servicosAgendados")
    private Servico servico;

    @MapsId("idProfissional")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idProfissional", nullable = false)
    @JsonIgnoreProperties("servicosAgendados")
    private Profissional profissional;

    @DecimalMin("0.01")
    @Column(nullable = false)
    private BigDecimal valor;

    @NotNull
    @Min(1)
    @Max(2)
    @Column(nullable = false)
    private Short status = 1;
}
