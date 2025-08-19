package com.teste.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Table(name = "Catalogo")
public class Catalogo {

    @EmbeddedId
    private CatalogoId id;

    @MapsId("idProfissional")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idProfissional", nullable = false)
    @JsonIgnoreProperties({ "catalogos", "servicosAgendados" })
    private Profissional profissional;

    @MapsId("idServico")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idServico", nullable = false)
    @JsonIgnoreProperties({ "catalogos", "servicosAgendados" })
    private Servico servico;

    @DecimalMin("0.01")
    @Column
    private java.math.BigDecimal valor;

    @Min(1)
    @Column(name = "tempoMedio")
    private Integer tempoMedio;

    @NotNull
    @Min(1)
    @Max(2)
    @Column(nullable = false)
    private Short status = 1;
}
