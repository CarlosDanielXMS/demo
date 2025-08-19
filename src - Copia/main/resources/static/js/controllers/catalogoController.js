document.addEventListener("DOMContentLoaded", () => {
  const { Api, Modal, Dom } = window.App;

  const tbody        = Dom.qs("#catalogos-body");
  const searchInput  = Dom.qs("#search-catalogo");
  const statusFilter = Dom.qs("#filter-catalogo-status");
  const addBtn       = Dom.qs("#add-catalogo-btn");
  const modal        = Dom.qs("#catalogo-modal");
  const form         = Dom.qs("#catalogo-form");
  const cancelBtn    = Dom.qs("#catalogo-cancel");

  if (!tbody || !form || !modal) return;

  const isAtivo  = (status) => Number(status) === 1;
  const fmtMoney = (v) => (v == null || v === "") ? "-" : Number(v).toFixed(2);
  const fmtInt   = (v) => (v == null || v === "") ? "-" : parseInt(v, 10);

  const profCache = new Map();
  const servCache = new Map();

  let profissionaisAtivos = [];
  let servicosAtivos = [];

  async function carregarSeletores() {
    try {
      profissionaisAtivos = await Api.Profissionais.list("?status=1");
    } catch { profissionaisAtivos = []; }
    try {
      servicosAtivos = await Api.Servicos.list("?status=1");
    } catch { servicosAtivos = []; }

    const profSel = Dom.qs("#profissional");
    const servSel = Dom.qs("#servico");

    profSel.innerHTML = profissionaisAtivos.map(p => `<option value="${p.id}">${p.nome}</option>`).join("");
    servSel.innerHTML = servicosAtivos.map(s => `<option value="${s.id}">${s.descricao}</option>`).join("");
  }

  async function getProfissional(id) {
    if (!id) return null;
    if (profCache.has(id)) return profCache.get(id);
    const p = await Api.Profissionais.get(id);
    profCache.set(id, p);
    return p;
  }

  async function getServico(id) {
    if (!id) return null;
    if (servCache.has(id)) return servCache.get(id);
    const s = await Api.Servicos.get(id);
    servCache.set(id, s);
    return s;
  }

  async function enriquecer(c) {
    const profId = c?.profissional?.id ?? c?.id?.profissionalId ?? c?.id?.profissional?.id ?? null;
    const servId = c?.servico?.id      ?? c?.id?.servicoId      ?? c?.id?.servico?.id      ?? null;

    const [p, s] = await Promise.all([
      c.profissional ? Promise.resolve(c.profissional) : getProfissional(profId),
      c.servico      ? Promise.resolve(c.servico)      : getServico(servId)
    ]);

    if (p) c.profissional = p;
    if (s) c.servico = s;
    return c;
  }

  const renderRow = (c) => {
    const ativo = isAtivo(c.status);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.profissional?.nome ?? "-"}</td>
      <td>${c.servico?.descricao ?? "-"}</td>
      <td>${fmtMoney(c.valor)}</td>
      <td>${fmtInt(c.tempoMedio)}</td>
      <td>
        <span class="status-badge ${ativo ? 'status-active' : 'status-inactive'}">
          ${ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td class="actions">
        <button class="btn-icon-only edit-catalogo-btn"
                data-id-prof="${c.profissional?.id ?? c?.id?.profissionalId ?? ''}"
                data-id-serv="${c.servico?.id ?? c?.id?.servicoId ?? ''}"
                title="Editar">
          <span class="material-icons">edit</span>
        </button>
        <button class="btn-icon-only toggle-status-btn"
                data-id-prof="${c.profissional?.id ?? c?.id?.profissionalId ?? ''}"
                data-id-serv="${c.servico?.id ?? c?.id?.servicoId ?? ''}"
                data-status="${Number(c.status)}"
                title="${ativo ? 'Inativar' : 'Reativar'}">
          <span class="material-icons">${ativo ? 'delete' : 'undo'}</span>
        </button>
      </td>
    `;
    return tr;
  };

  const bindRowEvents = () => {
    Dom.qsa(".edit-catalogo-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const profId = Number(btn.getAttribute("data-id-prof"));
        const servId = Number(btn.getAttribute("data-id-serv"));
        const raw = await Api.Catalogo.get(profId, servId);
        const c = await enriquecer(raw);
        openModal(c);
      });
    });

    Dom.qsa(".toggle-status-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const profId = Number(btn.getAttribute("data-id-prof"));
        const servId = Number(btn.getAttribute("data-id-serv"));
        const currentStatus = Number(btn.getAttribute("data-status"));
        if (!confirm(`Confirmar ${currentStatus === 1 ? 'inativação' : 'reativação'}?`)) return;

        try {
          if (currentStatus === 1) {
            await Api.Catalogo.remove(profId, servId);
          } else {
            await Api.Catalogo.reativar(profId, servId);
          }
          reloadWithCurrentFilters();
        } catch (err) {
          console.error("Erro ao atualizar status do catálogo:", err);
          alert("Operação falhou. Verifique o console.");
        }
      });
    });
  };

  const loadCatalogos = async (filters = {}) => {
    try {
      const qs = new URLSearchParams(filters).toString();
      const lista = await Api.Catalogo.list(qs ? `?${qs}` : "");
      const enriquecida = await Promise.all(lista.map(enriquecer));

      enriquecida.sort((a, b) => (a.status === b.status ? 0 : (a.status === 1 ? -1 : 1)));

      tbody.innerHTML = "";
      enriquecida.forEach(c => tbody.appendChild(renderRow(c)));
      bindRowEvents();
      aplicarFiltroTexto();
    } catch (err) {
      console.error("Erro ao carregar catálogos:", err);
      alert("Erro ao carregar dados. Verifique o console.");
    }
  };

  const openModal = (c = null) => {
    form.reset();
    Dom.qs("#originalProfId").value = "";
    Dom.qs("#originalServId").value = "";

    carregarSeletores().then(() => {
      if (c) {
        Dom.qs("#modal-title").textContent = "Editar Item";
        Dom.qs("#profissional").value = c.profissional?.id ?? c?.id?.profissionalId ?? "";
        Dom.qs("#servico").value      = c.servico?.id      ?? c?.id?.servicoId      ?? "";
        Dom.qs("#valor").value        = c.valor ?? "";
        Dom.qs("#tempoMedio").value   = c.tempoMedio ?? "";
        Dom.qs("#status").value       = String(c.status ?? 1);

        Dom.qs("#originalProfId").value = c.profissional?.id ?? c?.id?.profissionalId ?? "";
        Dom.qs("#originalServId").value = c.servico?.id      ?? c?.id?.servicoId      ?? "";
      } else {
        Dom.qs("#modal-title").textContent = "Cadastrar Item";
        Dom.qs("#status").value = "1";
      }
      Modal.open(modal);
    });
  };

  const reloadWithCurrentFilters = () => {
    const stVal = statusFilter.value === 'all' ? null : statusFilter.value;
    const filters = {};
    if (stVal) filters.status = stVal;
    loadCatalogos(filters);
  };

  const aplicarFiltroTexto = () => {
    const q = (searchInput.value || "").trim().toLowerCase();
    const rows = Dom.qsa("#catalogos-body tr");
    rows.forEach(tr => {
      const prof = (tr.cells[0]?.textContent || "").toLowerCase();
      const serv = (tr.cells[1]?.textContent || "").toLowerCase();
      tr.style.display = !q || prof.includes(q) || serv.includes(q) ? "" : "none";
    });
  };

  addBtn.addEventListener("click", () => openModal());
  Modal.bindBasic(modal, ".close-button");
  cancelBtn.addEventListener("click", () => Modal.close(modal));

  searchInput.addEventListener("input", aplicarFiltroTexto);
  statusFilter.addEventListener("change", reloadWithCurrentFilters);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd  = new FormData(form);
    const raw = Object.fromEntries(fd.entries());

    const profIdSel = Number(raw["profissional.id"] || 0);
    const servIdSel = Number(raw["servico.id"] || 0);
    const valor     = raw.valor != null && raw.valor !== "" ? Number(raw.valor) : NaN;
    const tempo     = raw.tempoMedio != null && raw.tempoMedio !== "" ? Number(raw.tempoMedio) : NaN;
    const status    = Number(raw.status || 1);

    if (!profIdSel) { alert("Selecione um profissional."); return; }
    if (!servIdSel) { alert("Selecione um serviço."); return; }
    if (!(valor > 0)) { alert("Valor deve ser maior que 0."); return; }
    if (!(tempo > 0)) { alert("Tempo médio deve ser maior que 0."); return; }

    const body = {
      profissional: { id: profIdSel },
      servico:     { id: servIdSel },
      valor,
      tempoMedio: Math.trunc(tempo),
      status
    };

    const originalProfId = Number(raw["originalProfId"] || 0);
    const originalServId = Number(raw["originalServId"] || 0);

    try {
      if (originalProfId && originalServId) {
        await Api.Catalogo.update(originalProfId, originalServId, body);
      } else {
        await Api.Catalogo.create(body);
      }
      Modal.close(modal);
      reloadWithCurrentFilters();
    } catch (err) {
      if (!originalProfId && !originalServId && profIdSel && servIdSel) {
        try {
          await Api.Catalogo.update(profIdSel, servIdSel, body);
          Modal.close(modal);
          reloadWithCurrentFilters();
          return;
        } catch (err2) {
          console.error("Erro no fallback de update:", err2);
        }
      }
      console.error("Erro ao salvar item do catálogo:", err);
      alert("Erro ao salvar. Verifique o console.");
    }
  });

  statusFilter.value = "1";
  loadCatalogos({ status: 1 });
});
