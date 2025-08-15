package com.teste.demo.controller.api;

import com.teste.demo.model.Agenda;
import com.teste.demo.service.AgendaService;
import com.teste.demo.service.ProfissionalService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/agendamentos")
public class AgendaController {

	private final AgendaService service;
	private final ProfissionalService profissionalService;

	@GetMapping
	public List<Agenda> listarTodos() {
		return service.listarTodos();
	}

	@GetMapping("/ativos")
	public List<Agenda> listarAtivos() {
		return service.listarAtivos();
	}

	@GetMapping("/{id}")
	public Agenda buscarPorId(@PathVariable Integer id) {
		return service.buscarPorId(id);
	}

	@PostMapping
	public Agenda criar(@RequestBody Agenda agenda) {
		return service.criar(agenda);
	}

	@PutMapping("/{id}")
	public Agenda atualizar(@PathVariable Integer id, @RequestBody Agenda agenda) {
		agenda.setId(id);
		return service.atualizar(agenda);
	}

	@DeleteMapping("/{id}")
	public void inativar(@PathVariable Integer id) {
		service.inativar(id);
	}

	@PostMapping("/{id}/reativar")
	public void reativar(@PathVariable Integer id) {
		service.reativar(id);
	}

	@GetMapping("/profissionais-disponiveis")
	public List<?> profissionaisDisponiveis(@RequestParam(required = false) String inicio,
										   @RequestParam(required = false) Integer duracaoMin,
										   @RequestParam(required = false) Integer servicoId) {
		return profissionalService.listarAtivos();
	}
}
