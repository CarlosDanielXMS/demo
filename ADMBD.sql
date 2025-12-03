

--===============================
--		Triggers
--===============================

CREATE TRIGGER trg_SoftDeleteAgenda
ON Agenda
INSTEAD OF DELETE
AS
BEGIN

    UPDATE a
    SET a.status = 2
    FROM Agenda as a
    INNER JOIN deleted d ON a.id = d.id;
END;
GO

CREATE TRIGGER trg_SoftDeleteServicoAgendado
ON Servico_Agendado
INSTEAD OF DELETE
AS
BEGIN

    UPDATE sa
    SET sa.status = 2
    FROM Servico_Agendado as sa
    INNER JOIN deleted d ON sa.idAgenda = d.idAgenda AND
		sa.idProfissional = d.idProfissional AND
		sa.idServico = d.idServico;
END;
GO

CREATE TRIGGER trg_SoftDeleteCatalogo
ON Catalogo
INSTEAD OF DELETE
AS
BEGIN

    UPDATE cat
    SET cat.status = 2
    FROM Catalogo as cat
    INNER JOIN deleted d ON cat.idProfissional = d.idProfissional AND
		cat.idServico = d.idServico;
END;
GO

CREATE TRIGGER trg_SoftDeleteServico
ON Servico
INSTEAD OF DELETE
AS
BEGIN

    UPDATE s
    SET s.status = 2
    FROM Servico as s
    INNER JOIN deleted d ON s.id = d.id;
END;
GO

CREATE TRIGGER trg_SoftDeleteProfissional
ON Profissional
INSTEAD OF DELETE
AS
BEGIN

    UPDATE p
    SET p.status = 2
    FROM Profissional as p
    INNER JOIN deleted d ON p.id = d.id;
END;
GO

CREATE TRIGGER trg_SoftDeleteCliente
ON Cliente
INSTEAD OF DELETE
AS
BEGIN

    UPDATE cli
    SET cli.status = 2
    FROM Cliente as cli
    INNER JOIN deleted d ON cli.id = d.id;
END;
GO


--===============================
--		Procedure
--===============================

CREATE PROCEDURE sp_RecalcularTotaisAgenda
(
    @idAgenda INT
)
AS
	BEGIN
		BEGIN TRAN
			UPDATE a
			SET 
				a.valorTotal = ISNULL((
					SELECT SUM(sa.valor)
					FROM Servico_Agendado as sa
					WHERE sa.idAgenda = a.id AND
					  sa.status = 1
				), 0),

				a.tempoTotal = ISNULL((
					SELECT SUM(c.tempoMedio)
					FROM Servico_Agendado as sa
					INNER JOIN Catalogo c
						ON sa.idProfissional = c.idProfissional AND
						sa.idServico = c.idServico
					WHERE sa.idAgenda = a.id AND
					  sa.status = 1 AND
					  c.status = 1
				), 0)
			FROM Agenda as a
			WHERE a.id = @idAgenda;

			COMMIT TRAN
	END;
GO


--===============================
--		Function
--===============================

CREATE FUNCTION fn_ProfissionaisDisponiveis
(
    @idServico INT,
    @dataHora DATETIME2
)
RETURNS TABLE
AS
RETURN
(
    SELECT p.id, p.nome, p.telefone, p.email
    FROM Profissional as p
    INNER JOIN Catalogo c
        ON p.id = c.idProfissional
       AND c.idServico = @idServico
       AND c.status = 1
    WHERE p.status = 1
      AND NOT EXISTS (
          SELECT 1
          FROM Servico_Agendado as sa
          INNER JOIN Catalogo c2
              ON sa.idProfissional = c2.idProfissional
             AND sa.idServico = c2.idServico
          INNER JOIN Agenda a
              ON sa.idAgenda = a.id
          WHERE sa.idProfissional = p.id
            AND sa.status = 1
            AND (
                 @dataHora < DATEADD(MINUTE, c2.tempoMedio, a.dataHora)
                 AND DATEADD(MINUTE, c.tempoMedio, @dataHora) > a.dataHora
            )
      )
);
GO


--===============================
--		View
--===============================

CREATE VIEW vw_FatoAgendamento AS
SELECT 
    a.id AS idAgenda,
    a.dataHora,
    a.tempoTotal,
    a.valorTotal AS valorAgenda,
    sa.idServico,
    sa.idProfissional,
    sa.valor AS valorServicoAgendado,
    c.valor AS valorCatalogo,
    s.descricao AS servicoDescricao,
    p.nome AS profissionalNome,
    cl.nome AS clienteNome
FROM Agenda a
    LEFT JOIN Servico_Agendado sa 
        ON sa.idAgenda = a.id
    LEFT JOIN Servico s 
        ON s.id = sa.idServico
    LEFT JOIN Catalogo c 
        ON c.idProfissional = sa.idProfissional 
       AND c.idServico = sa.idServico
    LEFT JOIN Profissional p 
        ON p.id = sa.idProfissional
    LEFT JOIN Cliente cl 
        ON cl.id = a.idCliente
GO


select * from Servico_Agendado
select * from Agenda
select * from Servico
select * from Catalogo
select * from Cliente
select * from Profissional

select * from vw_FatoAgendamento
