document.addEventListener("DOMContentLoaded", () => {
  const { Api, Modal, Dom } = window.App;
  const clientesBody = Dom.qs("#clientes-body");
  const searchInput = Dom.qs("#search-cliente");
  const statusFilter = Dom.qs("#filter-cliente-status");
  const addBtn = Dom.qs("#add-cliente-btn");
  const modal = Dom.qs("#cliente-modal");
  const form = Dom.qs("#cliente-form");
  const cancelBtn    = Dom.qs("#cliente-cancel");
  const senhaGroup = Dom.qs("#senha-group");
  const senhaInput = Dom.qs("#senha");

  const isAtivo = (status) => Number(status) === 1;

  const renderClienteRow = (cliente) => {
    const ativo = isAtivo(cliente.status);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cliente.nome}</td>
      <td>${cliente.telefone || '-'}</td>
      <td>${cliente.email || '-'}</td>
      <td>
        <span class="status-badge ${ativo ? 'status-active' : 'status-inactive'}">
          ${ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td class="actions">
        <button class="btn-icon-only edit-cliente-btn" data-id="${cliente.id}" title="Editar">
          <span class="material-icons">edit</span>
        </button>
        <button class="btn-icon-only toggle-status-btn" data-id="${cliente.id}"
                data-status="${Number(cliente.status)}" title="${ativo ? 'Inativar' : 'Reativar'}">
          <span class="material-icons">${ativo ? 'delete' : 'undo'}</span>
        </button>
      </td>
    `;
    return tr;
  };

  const loadClientes = async (filters = {}) => {
    try {
      const query = new URLSearchParams(filters).toString();
      let clientes = await Api.Clientes.list(query ? `?${query}` : '');

      clientes.sort((a, b) => (a.status === b.status ? 0 : (a.status === 1 ? -1 : 1)));

      clientesBody.innerHTML = '';
      clientes.forEach(cliente => clientesBody.appendChild(renderClienteRow(cliente)));
      bindEvents();
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
      alert("Erro ao carregar dados. Verifique o console.");
    }
  };

  const bindEvents = () => {
    Dom.qsa(".edit-cliente-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const cliente = await Api.Clientes.get(id);
        openModal(cliente);
      });
    });

    Dom.qsa(".toggle-status-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const currentStatus = Number(btn.dataset.status);
        if (confirm(`Confirmar ${currentStatus === 1 ? 'inativação' : 'reativação'}?`)) {
          try {
            if (currentStatus === 1) {
              await Api.Clientes.remove(id);
            } else {
              await Api.Clientes.reativar(id);
            }
            const statusVal = statusFilter.value === 'all' ? null : statusFilter.value;
            const nomeVal = searchInput.value || null;
            loadClientes({ ...(statusVal ? { status: statusVal } : {}), ...(nomeVal ? { nome: nomeVal } : {}) });
          } catch (err) {
            console.error("Erro ao atualizar status:", err);
            alert("Operação falhou. Verifique o console.");
          }
        }
      });
    });
  };

  const openModal = (cliente = null) => {
    form.reset();

    const existingIdField = Dom.qs('input[name="id"]', form);
    if (existingIdField) existingIdField.remove();

    if (cliente) {
      Dom.qs("#nome").value = cliente.nome || '';
      Dom.qs("#telefone").value = cliente.telefone || '';
      Dom.qs("#email").value = cliente.email || '';
      Dom.qs("#status").value = String(cliente.status ?? 1);

      senhaGroup.style.display = 'none';
      senhaInput.value = '';
      senhaInput.required = false;

      const idField = document.createElement('input');
      idField.type = 'hidden';
      idField.name = 'id';
      idField.value = cliente.id;
      form.appendChild(idField);

      Dom.qs("#modal-title").textContent = "Editar Cliente";
    } else {
      Dom.qs("#status").value = "1";
      senhaGroup.style.display = 'block';
      senhaInput.required = true;
      senhaInput.value = '';
      Dom.qs("#modal-title").textContent = "Novo Cliente";
    }

    Modal.open(modal);
  };

  addBtn.addEventListener("click", () => openModal());

  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const rows = Dom.qsa("#clientes-body tr");
    rows.forEach(row => {
      const nome = row.cells[0].textContent.toLowerCase();
      const telefone = row.cells[1].textContent.toLowerCase();
      const email = row.cells[2].textContent.toLowerCase();
      const show = nome.includes(searchTerm) || telefone.includes(searchTerm) || email.includes(searchTerm);
      row.style.display = show ? "" : "none";
    });
  });

  statusFilter.addEventListener("change", () => {
    const status = statusFilter.value === 'all' ? null : statusFilter.value;
    loadClientes({ status });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const raw = Object.fromEntries(fd.entries());

    const payload = {
      id: raw.id ? Number(raw.id) : undefined,
      nome: (raw.nome || '').trim(),
      telefone: (raw.telefone || '').trim(),
      email: raw.email ? raw.email.trim() : null,
      status: Number(raw.status || 1),
    };

    if (!payload.id) {
      payload.senha = raw.senha ? String(raw.senha) : '';
    }

    try {
      if (payload.id) {
        await Api.Clientes.update(payload.id, payload);
      } else {
        await Api.Clientes.create(payload);
      }
      Modal.close(modal);
      const statusVal = statusFilter.value === 'all' ? null : statusFilter.value;
      const nomeVal = searchInput.value || null;
      loadClientes({ ...(statusVal ? { status: statusVal } : {}), ...(nomeVal ? { nome: nomeVal } : {}) });
    } catch (err) {
      console.error("Erro ao salvar cliente:", err);
      alert("Erro ao salvar. Verifique o console.");
    }
  });

  Modal.bindBasic(modal, ".close-button");
  cancelBtn.addEventListener("click", () => Modal.close(modal));

  loadClientes({ status: 1 });
});
