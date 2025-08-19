document.addEventListener("DOMContentLoaded", () => {
  const { Api, Modal, Dom } = window.App;

  const tbody        = Dom.qs("#servicos-body");
  const searchInput  = Dom.qs("#search-servico");
  const statusFilter = Dom.qs("#filter-servico-status");
  const addBtn       = Dom.qs("#add-servico-btn");
  const modal        = Dom.qs("#servico-modal");
  const form         = Dom.qs("#servico-form");
  const cancelBtn    = Dom.qs("#servico-cancel");

  if (!tbody || !form || !modal) return;

  const isAtivo = (status) => Number(status) === 1;
  const fmtMoney = (v) => (v == null || v === "") ? "-" : Number(v).toFixed(2);
  const fmtInt   = (v) => (v == null || v === "") ? "-" : parseInt(v, 10);

  const renderRow = (s) => {
    const ativo = isAtivo(s.status);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.descricao}</td>
      <td>${fmtMoney(s.valor)}</td>
      <td>${fmtInt(s.tempoMedio)}</td>
      <td>
        <span class="status-badge ${ativo ? 'status-active' : 'status-inactive'}">
          ${ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td class="actions">
        <button class="btn-icon-only edit-servico-btn" data-id="${s.id}" title="Editar">
          <span class="material-icons">edit</span>
        </button>
        <button class="btn-icon-only toggle-status-btn" data-id="${s.id}" data-status="${Number(s.status)}"
                title="${ativo ? 'Inativar' : 'Reativar'}">
          <span class="material-icons">${ativo ? 'delete' : 'undo'}</span>
        </button>
      </td>
    `;
    return tr;
  };

  const bindRowEvents = () => {
    Dom.qsa(".edit-servico-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const s  = await Api.Servicos.get(id);
        openModal(s);
      });
    });

    Dom.qsa(".toggle-status-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const currentStatus = Number(btn.getAttribute("data-status"));
        if (!id) return;
        if (!confirm(`Confirmar ${currentStatus === 1 ? 'inativação' : 'reativação'}?`)) return;

        try {
          if (currentStatus === 1) {
            await Api.Servicos.remove(id);
          } else {
            await Api.Servicos.reativar(id);
          }
          reloadWithCurrentFilters();
        } catch (err) {
          console.error("Erro ao atualizar status do serviço:", err);
          alert("Operação falhou. Verifique o console.");
        }
      });
    });
  };

  const loadServicos = async (filters = {}) => {
    try {
      const qs = new URLSearchParams(filters).toString();
      const servicos = await Api.Servicos.list(qs ? `?${qs}` : '');

      servicos.sort((a, b) => (a.status === b.status ? 0 : (a.status === 1 ? -1 : 1)));

      tbody.innerHTML = "";
      servicos.forEach(s => tbody.appendChild(renderRow(s)));
      bindRowEvents();
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
      alert("Erro ao carregar dados. Verifique o console.");
    }
  };

  const openModal = (s = null) => {
    form.reset();
    Dom.qs("#servico-id").value = "";

    if (s) {
      Dom.qs("#descricao").value   = s.descricao ?? "";
      Dom.qs("#valor").value       = s.valor ?? "";
      Dom.qs("#tempoMedio").value  = s.tempoMedio ?? "";
      Dom.qs("#status").value      = String(s.status ?? 1);
      Dom.qs("#servico-id").value  = s.id;
      Dom.qs("#modal-title").textContent = "Editar Serviço";
    } else {
      Dom.qs("#status").value = "1";
      Dom.qs("#modal-title").textContent = "Cadastrar Serviço";
    }

    Modal.open(modal);
  };

  const reloadWithCurrentFilters = () => {
    const stVal   = statusFilter.value === 'all' ? null : statusFilter.value;
    const descVal = (searchInput.value || "").trim();
    const filters = {};
    if (stVal)   filters.status = stVal;
    if (descVal) filters.descricao = descVal;
    loadServicos(filters);
  };

  addBtn.addEventListener("click", () => openModal());
  Modal.bindBasic(modal, ".close-button");
  cancelBtn.addEventListener("click", () => Modal.close(modal));

  searchInput.addEventListener("input", () => reloadWithCurrentFilters());
  statusFilter.addEventListener("change", () => reloadWithCurrentFilters());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd  = new FormData(form);
    const raw = Object.fromEntries(fd.entries());

    const valor = raw.valor != null && raw.valor !== "" ? Number(raw.valor) : NaN;
    const tempo = raw.tempoMedio != null && raw.tempoMedio !== "" ? Number(raw.tempoMedio) : NaN;

    if (!(valor > 0)) { alert("Valor deve ser maior que 0."); return; }
    if (!(tempo > 0)) { alert("Tempo médio deve ser maior que 0."); return; }

    const payload = {
      id: raw.id ? Number(raw.id) : undefined,
      descricao: (raw.descricao || "").trim(),
      valor: valor,
      tempoMedio: Math.trunc(tempo),
      status: Number(raw.status || 1)
    };

    try {
      if (payload.id) {
        await Api.Servicos.update(payload.id, payload);
      } else {
        await Api.Servicos.create(payload);
      }
      Modal.close(modal);
      reloadWithCurrentFilters();
    } catch (err) {
      console.error("Erro ao salvar serviço:", err);
      alert("Erro ao salvar. Verifique o console.");
    }
  });

  statusFilter.value = "1";
  loadServicos({ status: 1 });
});
