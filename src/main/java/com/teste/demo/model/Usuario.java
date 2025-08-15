package com.teste.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonProperty;


@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@MappedSuperclass
public abstract class Usuario implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank
    @Column(nullable = false, length = 50)
    private String nome;

    @NotBlank
    @Column(nullable = false, length = 11, unique = true)
    private String telefone;

    @Email
    @Column(length = 30, unique = true)
    private String email;

    @Size(min = 8)
    @Column(nullable = false, length = 60)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

    @NotNull
    @Min(1) @Max(2)
    @Column(nullable = false)
    private Short status = 1;
}
