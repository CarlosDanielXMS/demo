document.addEventListener('DOMContentLoaded', () => {
  const { Api, Modal, Dom } = window.App;

  const tbody = Dom.qs('#profissionais-body');
  const searchInput = Dom.qs('#search-profissional');
  const statusFilter = Dom.qs('#filter-profissional-status');
  const addBtn = Dom.qs('#add-profissional-btn');
  const modal = Dom.qs('#profissional-modal');
  const form = Dom.qs('#profissional-form');
  const cancelBtn = Dom.qs('#profissional-cancel');
  const senhaGroup = Dom.qs('#senha-group');
  const senhaInput = Dom.qs('#senha');

  if (!tbody || !form || !modal) return;

  const isAtivo = (status) => Number(status) === 1;

  const formatNumber = (v) => {
    if (v == null || v === '') return '-';
    return Number(v).toFixed(2);
  };

  const renderRow = (p) => {
    const ativo = isAtivo(p.status);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.nome}</td>
      <td>${p.telefone || '-'}</td>
      <td>${p.email || '-'}</td>
      <td>${formatNumber(p.salarioFixo)}</td>
      <td>${formatNumber(p.comissao)}</td>
      <td>
        <span class="status-badge ${ativo ? 'status-active' : 'status-inactive'}">
          ${ativo ? 'Ativo' : 'Inativo'}
        </span>
      </td>
      <td class="actions">
        <button class="btn-icon-only edit-profissional-btn" data-id="${p.id}" title="Editar">
          <span class="material-icons">edit</span>
        </button>
        <button class="btn-icon-only toggle-status-btn" data-id="${p.id}" data-status="${Number(p.status)}"
                title="${ativo ? 'Inativar' : 'Reativar'}">
          <span class="material-icons">${ativo ? 'delete' : 'undo'}</span>
        </button>
      </td>
    `;
    return tr;
  };

  const bindRowEvents = () => {
    Dom.qsa('.edit-profissional-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const p = await Api.Profissionais.get(id);
        openModal(p);
      });
    });

    Dom.qsa('.toggle-status-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const currentStatus = Number(btn.getAttribute('data-status'));
        if (!id) return;
        if (!confirm(`Confirmar ${currentStatus === 1 ? 'inativação' : 'reativação'}?`)) return;

        try {
          if (currentStatus === 1) {
            await Api.Profissionais.remove(id);
          } else {
            await Api.Profissionais.reativar(id);
          }
          reloadWithCurrentFilters();
        } catch (err) {
          console.error('Erro ao atualizar status do profissional:', err);
          alert('Operação falhou. Verifique o console.');
        }
      });
    });
  };

  const loadProfissionais = async (filters = {}) => {
    try {
      const qs = new URLSearchParams(filters).toString();
      const profs = await Api.Profissionais.list(qs ? `?${qs}` : '');

      profs.sort((a, b) => (a.status === b.status ? 0 : (a.status === 1 ? -1 : 1)));

      tbody.innerHTML = '';
      profs.forEach(p => tbody.appendChild(renderRow(p)));
      bindRowEvents();
    } catch (err) {
      console.error('Erro ao carregar profissionais:', err);
      alert('Erro ao carregar dados. Verifique o console.');
    }
  };

  const openModal = (p = null) => {
    form.reset();
    Dom.qs('#profissional-id').value = '';

    if (p) {
      Dom.qs('#nome').value = p.nome ?? '';
      Dom.qs('#telefone').value = p.telefone ?? '';
      Dom.qs('#email').value = p.email ?? '';
      Dom.qs('#salarioFixo').value = p.salarioFixo ?? '';
      Dom.qs('#comissao').value = p.comissao ?? '';
      Dom.qs('#status').value = String(p.status ?? 1);
      Dom.qs('#profissional-id').value = p.id;

      senhaGroup.style.display = 'none';
      senhaInput.value = '';
      senhaInput.required = false;

      Dom.qs('#modal-title').textContent = 'Editar Profissional';
    } else {
      Dom.qs('#status').value = '1';
      senhaGroup.style.display = 'block';
      senhaInput.required = true;
      senhaInput.value = '';

      Dom.qs('#modal-title').textContent = 'Cadastrar Profissional';
    }

    Modal.open(modal);
  };

  const reloadWithCurrentFilters = () => {
    const stVal = statusFilter.value === 'all' ? null : statusFilter.value;
    const nameVal = (searchInput.value || '').trim();
    const filters = {};
    if (stVal) filters.status = stVal;
    if (nameVal) filters.nome = nameVal;
    loadProfissionais(filters);
  };

  addBtn.addEventListener('click', () => openModal());

  Modal.bindBasic(modal, '.close-button');
  cancelBtn.addEventListener('click', () => Modal.close(modal));

  searchInput.addEventListener('input', () => reloadWithCurrentFilters());
  statusFilter.addEventListener('change', () => reloadWithCurrentFilters());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const raw = Object.fromEntries(fd.entries());

    const payload = {
      id: raw.id ? Number(raw.id) : undefined,
      nome: (raw.nome || '').trim(),
      telefone: (raw.telefone || '').trim(),
      email: raw.email ? raw.email.trim() : null,
      salarioFixo: raw.salarioFixo != null && raw.salarioFixo !== '' ? Number(raw.salarioFixo) : null,
      comissao: raw.comissao != null && raw.comissao !== '' ? Number(raw.comissao) : null,
      status: Number(raw.status || 1)
    };

    if (!payload.id) {
      payload.senha = raw.senha ? String(raw.senha) : '';
    }

    try {
      if (payload.id) {
        await Api.Profissionais.update(payload.id, payload);
      } else {
        await Api.Profissionais.create(payload);
      }
      Modal.close(modal);
      reloadWithCurrentFilters();
    } catch (err) {
      console.error('Erro ao salvar profissional:', err);
      alert('Erro ao salvar. Verifique o console.');
    }
  });

  statusFilter.value = '1';
  loadProfissionais({ status: 1 });
});