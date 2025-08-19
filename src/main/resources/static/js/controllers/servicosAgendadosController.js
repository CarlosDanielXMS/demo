(function (global) {
  const { Api, Dom } = global.App;

  function toISO(dateStr,time){ return `${dateStr}T${time}`; }

  function createRow({ SERVICOS }, initial = {}) {
    const row = document.createElement("div");
    row.className = "sa-row";
    row.style.display = "grid";
    row.style.gridTemplateColumns = "minmax(180px,1fr) minmax(180px,1fr) 120px 120px 40px";
    row.style.gap = "8px";
    row.innerHTML = `
      <div class="form-group">
        <label>Serviço</label>
        <select class="sa-servico" required>
          <option value="">Selecione</option>
        </select>
      </div>
      <div class="form-group">
        <label>Profissional</label>
        <select class="sa-profissional" required disabled>
          <option value="">Selecione</option>
        </select>
      </div>
      <div class="form-group">
        <label>Tempo (min)</label>
        <input type="number" class="sa-tempo" min="1" step="1" value="0"/>
      </div>
      <div class="form-group">
        <label>Valor (R$)</label>
        <input type="number" class="sa-valor" min="0" step="0.01" value="0.00"/>
      </div>
      <div class="form-group" style="display:flex;align-items:flex-end;">
        <button type="button" class="btn btn-outline sa-remove" title="Remover">
          <span class="material-icons">delete</span>
        </button>
      </div>
    `;

    const selServico = row.querySelector(".sa-servico");
    const selProf    = row.querySelector(".sa-profissional");
    const inpTempo   = row.querySelector(".sa-tempo");
    const inpValor   = row.querySelector(".sa-valor");
    const btnRemove  = row.querySelector(".sa-remove");

    selServico.innerHTML = `<option value="">Selecione</option>`;
    (SERVICOS || []).forEach(s => {
      const opt = document.createElement("option");
      opt.value = String(s.id);
      opt.textContent = `${s.descricao}${s.tempoMedio?` (${s.tempoMedio} min)`:''}`;
      selServico.appendChild(opt);
    });

    if (initial.servicoId) selServico.value = String(initial.servicoId);
    if (initial.tempo != null) inpTempo.value = String(initial.tempo);
    if (initial.valor != null) inpValor.value = String(Number(initial.valor).toFixed(2));

    if (initial.profId)  row._profId = Number(initial.profId);
    if (initial.profNome) row._profName = String(initial.profNome);

    selServico.addEventListener("change", async () => {
      const sId = Number(selServico.value || 0);
      const s   = (SERVICOS || []).find(x => Number(x.id) === sId);
      inpTempo.value = String(s?.tempoMedio ?? 30);
      inpValor.value = String((typeof s?.valor === "number" ? s.valor : 0).toFixed ? (s.valor).toFixed(2) : (s?.valor ?? 0));
      row.dispatchEvent(new CustomEvent("sa:changed", { bubbles: true }));
    });

    inpTempo.addEventListener("input", () => row.dispatchEvent(new CustomEvent("sa:changed", { bubbles: true })));
    inpValor.addEventListener("input", () => row.dispatchEvent(new CustomEvent("sa:changed", { bubbles: true })));

    btnRemove.addEventListener("click", () => {
      row.remove();
      row.dispatchEvent(new CustomEvent("sa:changed", { bubbles: true }));
    });

    row.loadDisponibilidade = async ({ data, hora }) => {
      const sId = Number(selServico.value || 0);
      const tempo = Number(inpTempo.value || 0);
      selProf.innerHTML = `<option value="">Carregando...</option>`;
      selProf.disabled = true;

      if (!sId || !tempo || !data || !hora) {
        selProf.innerHTML = `<option value="">Selecione</option>`;
        return;
      }
      try {
        const inicio = toISO(data, hora);
        const disponiveis = await Api.Agendamentos.profDisp(inicio, tempo, sId);

        selProf.innerHTML = `<option value="">Selecione</option>`;
        let found = false;

        if (Array.isArray(disponiveis) && disponiveis.length) {
          disponiveis.forEach(p => {
            const opt=document.createElement("option");
            opt.value = String(p.id);
            opt.textContent = p.nome;
            selProf.appendChild(opt);
            if (row._profId && Number(p.id) === Number(row._profId)) found = true;
          });
        } else {}

        if (row._profId && !found) {
          const opt = document.createElement("option");
          opt.value = String(row._profId);
          opt.textContent = row._profName ? String(row._profName) : `Profissional #${row._profId}`;
          selProf.appendChild(opt);
        }

        if (row._profId) selProf.value = String(row._profId);
        selProf.disabled = false;
      } catch (e) {
        console.error("Disponibilidade (linha):", e);
        selProf.innerHTML = `<option value="">Erro</option>`;
      }
    };

    row.getItem = () => {
      const servicoId = Number(selServico.value || 0);
      const profissionalId = Number(selProf.value || 0);
      const tempo = Number(inpTempo.value || 0);
      const valor = Number(inpValor.value || 0);
      return { servicoId, profissionalId, tempo, valor };
    };

    return row;
  }

  function sumTotals(rows) {
    let minutos = 0, valor = 0;
    rows.forEach(r => {
      const { tempo, valor: v } = r.getItem();
      minutos += isFinite(tempo) ? tempo : 0;
      valor   += isFinite(v) ? v : 0;
    });
    return { minutos, valor };
  }

  function collectItems(rows) {
    const itens = [];
    for (const r of rows) {
      const { servicoId, profissionalId, tempo } = r.getItem();
      if (!servicoId || !profissionalId || !tempo) {
        return { ok:false, error: "Cada item precisa de Serviço, Profissional e Tempo." };
      }
      itens.push({
        servico: { id: servicoId },
        profissional: { id: profissionalId },
        status: 1
      });
    }
    return { ok:true, itens };
  }

  global.App.Modules = global.App.Modules || {};
  global.App.Modules.ServicosAgendados = {
    createRow,
    sumTotals,
    collectItems
  };
})(window);
