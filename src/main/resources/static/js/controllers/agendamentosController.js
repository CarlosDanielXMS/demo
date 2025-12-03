document.addEventListener('DOMContentLoaded', () => {
  const { Api, Dom, Modal, Modules } = window.App;
  const { ServicosAgendados } = Modules || {};

  let CLIENTES = [];
  let CATALOGOS = [];
  let SERVICOS = [];
  let PROFISSIONAIS = [];

  const calendarGrid = Dom.qs('#calendar-main-grid');
  const timeColumn = Dom.qs('.time-column');
  const periodLabel = Dom.qs('#current-period-display');

  const btnPrev = Dom.qs('#prev-week-btn');
  const btnNext = Dom.qs('#next-week-btn');
  const btnToday = Dom.qs('#today-btn');
  const btnWeek = Dom.qs('#week-view-btn');
  const btnDay = Dom.qs('#day-view-btn');
  const btnAdd = Dom.qs('#add-agenda-btn');

  const modal = Dom.qs('#agendamento-modal');
  const modalBody = Dom.qs('#agendamento-modal .modal-body');
  const modalTitle = Dom.qs('#modal-title');
  const btnCancelar = Dom.qs('#modal-cancelar');
  const btnInativar = Dom.qs('#modal-inativar');
  const btnReativar = Dom.qs('#modal-reativar');
  const btnConcluir = Dom.qs('#modal-concluir');
  const form = Dom.qs('#agendamento-form');
  const btnSalvar = Dom.qs('#modal-salvar') || (form && form.querySelector('button[type="submit"]'));

  const fieldId = Dom.qs('#agenda-id');
  const selCliente = Dom.qs('#agendamento-cliente');
  const inpData = Dom.qs('#agendamento-data');
  const inpHora = Dom.qs('#agendamento-hora');
  const selStatus = Dom.qs('#agendamento-status');

  const totalDurEl = Dom.qs('#total-duracao');
  const totalValEl = Dom.qs('#total-valor');
  const hiddenValor = Dom.qs('#agenda-valor-hidden');
  const hiddenDuracao = Dom.qs('#agenda-duracao-hidden');

  const saList = Dom.qs('#sa-list');
  const saAdd = Dom.qs('#sa-add');

  const START_HOUR = 7;
  const END_HOUR = 18;
  const SLOT_MIN = 30;
  const DAY_TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

  let currentView = 'day';
  let currentDate = new Date();
  let AGENDAS = [];
  let DAY_OVERLAYS = [];

  const pad2 = (n) => String(n).padStart(2, '0');
  const minutesFromStartOfDay = (d) => d.getHours() * 60 + d.getMinutes();
  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const addMinutes = (date, minutes) => { const d = new Date(date); d.setMinutes(d.getMinutes() + minutes); return d; };

  function parseLDT(iso) {
    if (!iso) return null;
    const [d, t] = String(iso).split('T');
    if (!d || !t) return new Date(iso);
    const [y, m, day] = d.split('-').map(Number);
    const [hh, mm = '0', ss = '0'] = t.split(':').map(Number);
    return new Date(y, (m - 1), day, hh, mm, ss);
  }

  function toISO(dateStr, time) { return `${dateStr}T${time}`; }

  function startOfWeek(date) {
    const d = new Date(date);
    const wd = d.getDay();
    const diff = (wd === 0 ? -6 : 1 - wd);
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatPeriodWeek(start) {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const s = start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const e = end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    return `${s} – ${e} de ${end.getFullYear()}`;
  }

  async function loadInitialData() {
    try {
      CLIENTES = await Api.Clientes.list();
      CATALOGOS = await Api.Catalogo.list();
      PROFISSIONAIS = await Api.Profissionais.list();
      SERVICOS = await Api.Servicos.list();
      fillClientes();
      fillProfissionais();
      fillServicos();
    } catch (e) {
      console.error('Falha ao carregar dados iniciais', e);
      alert('Não foi possível carregar clientes, catálogos, profissionais ou serviços.');
    }
  }

  function fillClientes() {
    if (!selCliente) return;
    selCliente.innerHTML = '<option value="">Selecione um cliente</option>';
    (CLIENTES || []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = `${c.nome ?? 'Sem nome'}`;
      selCliente.appendChild(opt);
    });
  }

  function fillProfissionais() {
    const sel = Dom.qs('#sa-profissional');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione um profissional</option>';
    (PROFISSIONAIS || []).forEach(p => {
      const opt = document.createElement('option');
      opt.value = String(p.id);
      opt.textContent = p.nome ?? 'Sem nome';
      sel.appendChild(opt);
    });
  }

  function fillServicos() {
    const sel = Dom.qs('#sa-servico');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecione um serviço</option>';
    (SERVICOS || []).forEach(s => {
      const opt = document.createElement('option');
      opt.value = String(s.id);
      opt.textContent = s.descricao ?? 'Sem descrição';
      sel.appendChild(opt);
    });
  }

  function getSaRows() { return Array.from(saList ? saList.querySelectorAll('.sa-row') : []); }

  function findCatalogoCache(profId, servId) {
    if (!CATALOGOS || !profId || !servId) return null;
    return CATALOGOS.find(c =>
      (c?.profissional?.id || c?.idProfissional) == profId &&
      (c?.servico?.id || c?.idServico) == servId
    ) || null;
  }

  function applyCatalogToRow(rowEl, catalog) {
    if (!catalog || !rowEl) return;

    const tempoVal = catalog.tempoMedio ?? catalog.tempo ?? null;

    try {
      if (tempoVal != null && typeof rowEl.setTempo === 'function') {
        rowEl.setTempo(Number(tempoVal));
      } else if (tempoVal != null && 'tempo' in rowEl) {
        rowEl.tempo = Number(tempoVal);
      }
    } catch (e) {
      console.warn('applyCatalogToRow: falha ao aplicar tempo via property/método', e);
    }

    try {
      if (rowEl.querySelector) {
        const tempoInputs = rowEl.querySelectorAll('.sa-tempo, input[name="tempo"], input.tempo, .tempo-input');
        tempoInputs.forEach(inp => {
          if (inp && 'value' in inp && tempoVal != null) inp.value = String(Number(tempoVal));
        });

        const tempoLabel = rowEl.querySelector('.sa-tempo-display, .tempo-display');
        if (tempoLabel && tempoVal != null) tempoLabel.textContent = String(Number(tempoVal));
      }
    } catch (e) {
      console.warn('applyCatalogToRow: falha ao atualizar inputs/labels de tempo', e);
    }

    try {
      if (typeof rowEl.dispatchEvent === 'function') {
        rowEl.dispatchEvent(new CustomEvent('sa:appliedCatalogo', { detail: { catalog } }));
      }
    } catch (e) {  }
  }


  async function updateCatalogoTempo(profId, servId, tempo) {
    try {
      let cat = findCatalogoCache(profId, servId) || null;

      if (!cat) {
        cat = await Api.Catalogo.get(profId, servId).catch(() => null);
      }

      if (!cat) {
        console.warn('Catálogo não encontrado para atualizar tempo', profId, servId);
        return null;
      }

      const tempoAtual = Number(cat.tempoMedio ?? cat.tempo ?? 0);
      if (Number(tempo) === tempoAtual) {
        return cat;
      }

      const payload = Object.assign({}, cat, { tempoMedio: Number(tempo) });

      let atualizado = null;
      try {
        atualizado = await Api.Catalogo.update(profId, servId, payload).catch(() => undefined);
      } catch (e) {
        atualizado = undefined;
      }

      if (!atualizado) {
        try {
          atualizado = await Api.Catalogo.get(profId, servId).catch(() => null);
        } catch (e) {
          atualizado = null;
        }
      }

      if (!atualizado) {
        atualizado = payload;
      }

      try {
        const idx = (CATALOGOS || []).findIndex(c =>
          (c?.profissional?.id || c?.idProfissional) == profId &&
          (c?.servico?.id || c?.idServico) == servId
        );
        if (idx >= 0) {
          CATALOGOS[idx] = atualizado;
        } else {
          CATALOGOS.push(atualizado);
        }
      } catch (e) {
        console.warn('Falha ao atualizar cache local CATALOGOS', e);
      }

      return atualizado;
    } catch (err) {
      console.error('Falha ao atualizar catálogo (tempoMedio)', err);
      return null;
    }
  }


  function recalcTotals() {
    const rows = getSaRows();
    const { minutos, valor } = (ServicosAgendados && typeof ServicosAgendados.sumTotals === 'function') ? ServicosAgendados.sumTotals(rows) : { minutos: 0, valor: 0 };

    if (hiddenDuracao) hiddenDuracao.value = String(minutos);
    if (hiddenValor) hiddenValor.value = String((Number.isFinite(valor) ? valor : 0).toFixed(2));

    if (totalDurEl) totalDurEl.textContent = `Duração total: ${minutos} min`;
    if (totalValEl) totalValEl.textContent = `Valor total: R$ ${(Number.isFinite(valor) ? valor : 0).toFixed(2)}`;

    const saEmpty = Dom.qs('#sa-empty');
    if (saEmpty) saEmpty.style.display = rows.length === 0 ? 'flex' : 'none';
  }

  async function loadDisponibilidadeAll() {
    if (!inpData || !inpHora) return;
    const data = inpData.value;
    const hora = inpHora.value;
    for (const r of getSaRows()) {
      if (typeof r.loadDisponibilidade === 'function') {
        await r.loadDisponibilidade({ data, hora });
      }
    }
  }

  function clearSaList() { if (saList) saList.innerHTML = ''; recalcTotals(); }

  function addSaRow(initial = {}) {
    if (!ServicosAgendados || typeof ServicosAgendados.createRow !== 'function') {
      console.error('ServicosAgendados.createRow não encontrado');
      return null;
    }

    const row = ServicosAgendados.createRow({ SERVICOS, CATALOGOS, PROFISSIONAIS }, initial);

    const setRowValor = (rowEl, valor) => {
      if (valor == null) return;
      try {
        if (typeof rowEl.setValor === 'function') {
          rowEl.setValor(Number(valor));
          return;
        }
        if ('valor' in rowEl) {
          rowEl.valor = Number(valor);
          return;
        }
      } catch (e) { }

      try {
        if (rowEl.querySelector) {
          const vInp = rowEl.querySelector('.sa-valor, input[name="valor"], input.valor, .valor-input');
          if (vInp && 'value' in vInp) {
            const num = Number(valor);
            vInp.value = Number.isFinite(num) ? num.toFixed(2) : String(valor);
          }
          const vLabel = rowEl.querySelector('.sa-valor-display, .valor-display');
          if (vLabel) {
            const num = Number(valor);
            vLabel.textContent = Number.isFinite(num) ? num.toFixed(2) : String(valor);
          }
        }
      } catch (e) { }
    };

    const readRowIdentifiers = (rowEl) => {
      let profId = undefined, servId = undefined, tempo = undefined, valor = undefined;
      try {
        profId = rowEl.profId || rowEl.profissionalId || (rowEl.profissional && rowEl.profissional.id) || undefined;
        servId = rowEl.servicoId || (rowEl.servico && rowEl.servico.id) || undefined;
      } catch (e) { }

      try {
        if ((!profId || !servId) && rowEl.querySelector) {
          const p = rowEl.querySelector('.sa-profissional, select.sa-profissional, select[name="profissional"]');
          const s = rowEl.querySelector('.sa-servico, select.sa-servico, select[name="servico"]');
          if (p && 'value' in p && !profId) profId = Number(p.value) || undefined;
          if (s && 'value' in s && !servId) servId = Number(s.value) || undefined;
        }
      } catch (e) { }

      try {
        if (typeof rowEl.getTempo === 'function') tempo = rowEl.getTempo();
        else if ('tempo' in rowEl) tempo = rowEl.tempo;
      } catch (e) { }

      try {
        if (typeof rowEl.getValor === 'function') valor = rowEl.getValor();
        else if ('valor' in rowEl) valor = rowEl.valor;
      } catch (e) { }

      try {
        if (rowEl.querySelector) {
          const t = rowEl.querySelector('.sa-tempo, input[name="tempo"], input.tempo');
          if (t && 'value' in t && (tempo == null || tempo === '')) tempo = t.value;
          const v = rowEl.querySelector('.sa-valor, input[name="valor"], input.valor');
          if (v && 'value' in v && (valor == null || valor === '')) valor = v.value;
        }
      } catch (e) { }

      return {
        profId: profId ? Number(profId) : undefined,
        servId: servId ? Number(servId) : undefined,
        tempo: tempo != null ? Number(tempo) : undefined,
        valor: valor != null ? Number(valor) : undefined
      };
    };

    const initialValorProvided = Object.prototype.hasOwnProperty.call(initial, 'valor') && initial.valor != null;

    (async () => {
      try {
        const profIdInit = initial.profId || initial.profissionalId || initial.profissional?.id;
        const servIdInit = initial.servicoId || initial.servico?.id;
        if (profIdInit && servIdInit) {
          let catalog = findCatalogoCache(profIdInit, servIdInit);
          if (!catalog) {
            catalog = await Api.Catalogo.get(profIdInit, servIdInit).catch(() => null);
            if (catalog) {
              const idx = (CATALOGOS || []).findIndex(c =>
                (c?.profissional?.id || c?.idProfissional) == profIdInit &&
                (c?.servico?.id || c?.idServico) == servIdInit
              );
              if (idx >= 0) CATALOGOS[idx] = catalog;
              else CATALOGOS.push(catalog);
            }
          }
          if (catalog) {
            applyCatalogToRow(row, catalog);

            if (initialValorProvided) {
              setRowValor(row, initial.valor);
            }

            recalcTotals();
          } else {
            if (initialValorProvided) setRowValor(row, initial.valor);
          }
        } else {
          if (initialValorProvided) setRowValor(row, initial.valor);
        }

        if (!initialValorProvided && Object.prototype.hasOwnProperty.call(initial, 'valor') && initial.valor != null) {
          setRowValor(row, initial.valor);
        }
      } catch (e) {
        console.warn('Erro ao aplicar catálogo inicial na row', e);
        if (initialValorProvided) setRowValor(row, initial.valor);
      }
    })();

    let dispoTimeout;
    let catalogoTimeout;

    row.addEventListener('sa:changed', () => {
      recalcTotals();
      clearTimeout(dispoTimeout);
      dispoTimeout = setTimeout(loadDisponibilidadeAll, 100);

      clearTimeout(catalogoTimeout);
      catalogoTimeout = setTimeout(async () => {
        try {
          const ids = readRowIdentifiers(row);
          const profId = ids.profId;
          const servId = ids.servId;
          const tempo = ids.tempo;

          if (profId && servId && Number.isFinite(tempo) && tempo > 0) {
            const atualizado = await updateCatalogoTempo(profId, servId, tempo);
            if (atualizado) {
              applyCatalogToRow(row, atualizado);

              const cur = readRowIdentifiers(row);
              if (cur.valor == null) {
                if (initialValorProvided) setRowValor(row, initial.valor);
              } else {
              }

              recalcTotals();
            }
          }
        } catch (e) {
          console.error('Erro ao atualizar catálogo a partir da row', e);
        }
      }, 600);
    });

    if (row.addEventListener) {
      row.addEventListener('sa:appliedCatalogo', () => {
        try {
          if (initialValorProvided) {
            setRowValor(row, initial.valor);
            recalcTotals();
          }
        } catch (e) {

        }
      });
    }

    saList.appendChild(row);

    if (initialValorProvided) {
      setRowValor(row, initial.valor);
    }

    recalcTotals();
    return row;
  }

  let freezeOverlay = Dom.qs('#form-freeze-overlay');
  if (!freezeOverlay && modalBody) {
    freezeOverlay = document.createElement('div');
    freezeOverlay.id = 'form-freeze-overlay';
    freezeOverlay.className = 'form-freeze-overlay';
    freezeOverlay.innerHTML = `
      <div class="freeze-content">
        <span class="material-icons">lock</span>
        <span class="freeze-text"></span>
      </div>`;
    modalBody.appendChild(freezeOverlay);
  }

  function setFormFrozen(frozen, reasonText = '') {
    if (!form) return;
    form.classList.toggle('is-frozen', !!frozen);
    if (freezeOverlay) {
      freezeOverlay.style.display = frozen ? 'flex' : 'none';
      const t = freezeOverlay.querySelector('.freeze-text');
      if (t) t.textContent = reasonText || (frozen ? 'Edição bloqueada' : '');
    }
    Dom.qsa('input, select, textarea', form).forEach(el => {
      if (el === fieldId || el === hiddenValor || el === hiddenDuracao) return;
      el.disabled = !!frozen;
    });
    Dom.qsa('.sa-remove', form).forEach(btn => { btn.disabled = !!frozen; });
    if (saAdd) saAdd.disabled = !!frozen;
    if (btnSalvar) btnSalvar.disabled = !!frozen;
  }

  function updateActionButtons(statusNum) {
    const s = Number(statusNum);
    if (btnInativar) btnInativar.style.display = 'none';
    if (btnReativar) btnReativar.style.display = 'none';
    if (btnConcluir) btnConcluir.style.display = 'none';
    if (btnSalvar) btnSalvar.style.display = 'inline-flex';
    if (s === 1) {
      if (btnInativar) btnInativar.style.display = 'inline-flex';
      if (btnConcluir) btnConcluir.style.display = 'inline-flex';
      if (btnSalvar) btnSalvar.style.display = 'inline-flex';
      setFormFrozen(false);
    } else if (s === 2) {
      if (btnReativar) btnReativar.style.display = 'inline-flex';
      if (btnSalvar) btnSalvar.style.display = 'none';
      setFormFrozen(true, 'Agendamento inativo');
    } else if (s === 3) {
      if (btnReativar) btnReativar.style.display = 'inline-flex';
      if (btnSalvar) btnSalvar.style.display = 'none';
      setFormFrozen(true, 'Agendamento concluído');
    }
  }

  if (Modal && typeof Modal.bindBasic === 'function') {
    Modal.bindBasic(modal, '#modal-cancelar');
  }

  function showModal(open) { if (modal) modal.style.display = open ? 'flex' : 'none'; }
  function closeModal() { showModal(false); }

  Dom.on(Dom.qs('#modal-close'), 'click', closeModal);
  if (btnCancelar) Dom.on(btnCancelar, 'click', (e) => { e.preventDefault(); closeModal(); });
  if (modal) Dom.on(modal, 'click', (e) => { if (e.target === modal) closeModal(); });

  function openCreateModal(prefillDate = new Date(), hour = null, minute = 0) {
    if (!modalTitle) return;
    modalTitle.textContent = 'Agendar Serviço';
    if (fieldId) fieldId.value = '';
    if (btnInativar) btnInativar.style.display = 'none';
    if (btnReativar) btnReativar.style.display = 'none';
    if (btnConcluir) btnConcluir.style.display = 'none';
    if (selCliente) selCliente.value = '';
    if (inpData) inpData.value = `${prefillDate.getFullYear()}-${pad2(prefillDate.getMonth() + 1)}-${pad2(prefillDate.getDate())}`;
    if (inpHora) inpHora.value = (hour != null) ? `${pad2(hour)}:${pad2(minute)}` : '08:00';
    if (selStatus) selStatus.value = '1';
    clearSaList();
    addSaRow();
    updateActionButtons(1);
    showModal(true);
  }

  async function openEditModal(id) {
    try {
      const a = await Api.Agendamentos.get(id);
      if (!a) throw new Error('Agenda não encontrada');

      if (modalTitle) modalTitle.textContent = `Editar Agendamento #${a.id}`;
      if (fieldId) fieldId.value = a.id;
      if (selCliente) selCliente.value = a?.cliente?.id ? String(a.cliente.id) : '';

      const dt = parseLDT(a.dataHora) || new Date();
      if (inpData) inpData.value = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
      if (inpHora) inpHora.value = `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
      if (selStatus) selStatus.value = String(a.status ?? 1);

      let itens = Array.isArray(a.servicosAgendados) ? a.servicosAgendados : [];
      if (!itens.length) {
        try {
          itens = await Api.ServicosAgendados.list(a.id);
        } catch {
          itens = [];
        }
      }

      clearSaList();

      if (itens.length) {
        const itensVisiveis = itens.filter(sa => Number(sa.status ?? 1) !== 2);

        itensVisiveis.forEach(sa => {
          const profId = sa?.profissional?.id;
          const servId = sa?.servico?.id;

          const catalog = findCatalogoCache(profId, servId);
          const tempoFromCat = catalog?.tempoMedio ?? catalog?.tempo;

          const valorDoSa = (sa?.valor != null && sa?.valor !== '') ? sa.valor : (sa?.servico?.valor != null ? sa.servico.valor : 0);

          const tempoDoSa = (sa?.tempo != null && sa?.tempo !== '') ? sa.tempo : (tempoFromCat != null ? tempoFromCat : (sa?.servico?.tempoMedio ?? 30));

          addSaRow({
            servicoId: servId,
            tempo: tempoDoSa,
            valor: valorDoSa,
            profId: profId,
            profNome: sa?.profissional?.nome
          });
        });

        if (itensVisiveis.length === 0) addSaRow();
      } else {
        addSaRow();
      }

      await loadDisponibilidadeAll();
      recalcTotals();
      updateActionButtons(Number(a.status ?? 1));
      showModal(true);
    } catch (e) {
      console.error('openEditModal error', e);
      alert('Não foi possível abrir o agendamento.');
    }
  }



  if (saAdd) Dom.on(saAdd, 'click', () => addSaRow({}));
  if (inpData) Dom.on(inpData, 'change', loadDisponibilidadeAll);
  if (inpHora) Dom.on(inpHora, 'change', loadDisponibilidadeAll);

  if (btnInativar) Dom.on(btnInativar, 'click', async () => {
    const id = Number(fieldId.value || 0);
    if (!id) return;
    if (!confirm(`Inativar Agendamento #${id}?`)) return;
    try {
      await Api.Agendamentos.remove(id);
      closeModal();
      await refreshAndRender();
    } catch (e) {
      console.error(e);
      alert('Falha ao inativar.');
    }
  });

  if (btnReativar) Dom.on(btnReativar, 'click', async () => {
    const id = Number(fieldId.value || 0);
    if (!id) return;
    if (!confirm(`Reativar Agendamento #${id}?`)) return;
    try {
      await Api.Agendamentos.reativar(id);
      closeModal();
      await refreshAndRender();
    } catch (e) {
      console.error(e);
      alert('Falha ao reativar.');
    }
  });

  if (btnConcluir) Dom.on(btnConcluir, 'click', async () => {
    const id = Number(fieldId.value || 0);
    if (!id) return;
    if (!confirm(`Concluir Agendamento #${id}?`)) return;
    try {
      await Api.Agendamentos.concluir(id);
      closeModal();
      await refreshAndRender();
    } catch (e) {
      console.error(e);
      alert('Falha ao concluir.');
    }
  });

  async function salvarAgendaEItens() {
    const id = Number(fieldId.value || 0);
    const clienteId = Number(selCliente ? selCliente.value : 0 || 0);
    const data = inpData ? inpData.value : null;
    const hora = inpHora ? inpHora.value : null;
    const status = Number(selStatus ? selStatus.value : 1);
    const rows = getSaRows();

    if (!clienteId || !data || !hora || rows.length === 0) {
      alert('Preencha Cliente, Data, Hora e adicione ao menos um Serviço.');
      return;
    }

    if (!ServicosAgendados || typeof ServicosAgendados.collectItems !== 'function') {
      alert('Módulo ServicosAgendados inválido.');
      return;
    }

    const itemsRes = ServicosAgendados.collectItems(rows);
    if (!itemsRes.ok) {
      alert(itemsRes.error);
      return;
    }
    const itens = itemsRes.itens;

    const { minutos, valor } = ServicosAgendados.sumTotals(rows);
    if (hiddenDuracao) hiddenDuracao.value = String(minutos);
    if (hiddenValor) hiddenValor.value = String(valor.toFixed(2));

    const agendaBody = {
      cliente: { id: clienteId },
      dataHora: toISO(data, hora),
      tempoTotal: minutos,
      valorTotal: valor,
      status
    };

    let agendaId = id || null;

    if (!agendaId) {
      const criado = await Api.Agendamentos.create(agendaBody);
      agendaId = criado?.id;
      if (!agendaId) throw new Error('Falha ao criar Agenda.');
    } else {
      await Api.Agendamentos.update(agendaId, agendaBody);
    }

    const existentes = await Api.ServicosAgendados.list(agendaId).catch(() => []);
    const key = sa => `${sa?.servico?.id || sa.servicoId}-${sa?.profissional?.id || sa.profissionalId}`;
    const mapaExist = new Map((existentes || []).map(sa => [key(sa), sa]));
    const mapaNovos = new Map((itens || []).map(sa => [key(sa), sa]));

    for (const [k, novo] of mapaNovos.entries()) {
      const ex = mapaExist.get(k);
      if (!ex) {
        try {
          await Api.ServicosAgendados.create(agendaId, novo);
        } catch (e) {
          console.error('Erro ao criar ServicoAgendado', novo, e);
          throw e;
        }
      } else {
        const sId = ex.servico?.id || ex.servicoId;
        const pId = ex.profissional?.id || ex.profissionalId;
        try {
          await Api.ServicosAgendados.update(agendaId, sId, pId, {
            tempo: novo.tempo,
            valor: novo.valor,
            status: novo.status ?? 1
          });
        } catch (e) {
          console.error('Erro ao atualizar ServicoAgendado', { agendaId, sId, pId, novo }, e);
          throw e;
        }
      }
    }

    for (const [k, ex] of mapaExist.entries()) {
      if (!mapaNovos.has(k)) {
        const sId = ex.servico?.id;
        const pId = ex.profissional?.id;
        try {
          await Api.ServicosAgendados.remove(agendaId, sId, pId);
        } catch (e) {
          console.error('Erro ao remover ServicoAgendado', { agendaId, sId, pId }, e);
        }
      }
    }

    await refreshAndRender();
  }

  if (form) Dom.on(form, 'submit', async (e) => {
    e.preventDefault();
    try {
      await salvarAgendaEItens();
      closeModal();
      await refreshAndRender();
    } catch (e) {
      console.error(e);
      alert('Falha ao salvar. Veja o console.');
    }
  });

  function setActiveViewButtons() {
    if (!btnDay || !btnWeek) return;
    if (currentView === 'day') {
      btnDay.classList.add('active');
      btnWeek.classList.remove('active');
    } else {
      btnWeek.classList.add('active');
      btnDay.classList.remove('active');
    }
  }

  if (btnWeek) Dom.on(btnWeek, 'click', () => { currentView = 'week'; setActiveViewButtons(); render(); });
  if (btnDay) Dom.on(btnDay, 'click', () => { currentView = 'day'; setActiveViewButtons(); render(); });
  if (btnPrev) Dom.on(btnPrev, 'click', () => { currentDate.setDate(currentDate.getDate() + (currentView === 'week' ? -7 : -1)); render(); });
  if (btnNext) Dom.on(btnNext, 'click', () => { currentDate.setDate(currentDate.getDate() + (currentView === 'week' ? +7 : +1)); render(); });
  if (btnToday) Dom.on(btnToday, 'click', () => { currentDate = new Date(); render(); });
  if (btnAdd) Dom.on(btnAdd, 'click', () => openCreateModal(currentDate));

  function renderTimeColumn() {
    if (!timeColumn) return;
    timeColumn.innerHTML = '';
    const totalSlots = (END_HOUR - START_HOUR) * (60 / SLOT_MIN);
    for (let i = 0; i <= totalSlots; i++) {
      const mins = i * SLOT_MIN;
      const h = Math.floor(mins / 60) + START_HOUR;
      const m = mins % 60;
      const div = document.createElement('div');
      div.className = 'time-slot-label';
      div.textContent = `${pad2(h)}:${pad2(m)}`;
      timeColumn.appendChild(div);
    }
  }

  function buildGridHeaderAndCells(cols, headers) {
    if (!calendarGrid || !timeColumn) return;
    calendarGrid.innerHTML = '';
    calendarGrid.style.position = 'relative';
    const corner = document.createElement('div');
    corner.className = 'grid-header-corner';
    calendarGrid.appendChild(corner);
    for (let c = 0; c < cols; c++) {
      const hd = document.createElement('div');
      hd.className = 'calendar-day-header';
      hd.innerHTML = headers[c];
      calendarGrid.appendChild(hd);
    }
    const totalRows = (END_HOUR - START_HOUR) * (60 / SLOT_MIN);
    const headerHeightPx = (calendarGrid.querySelector('.calendar-day-header')?.offsetHeight ||
      calendarGrid.querySelector('.grid-header-corner')?.offsetHeight ||
      50);
    calendarGrid.style.gridTemplateRows = `${headerHeightPx}px repeat(${totalRows}, var(--slot-height, 50px))`;
    timeColumn.style.paddingTop = `${headerHeightPx}px`;
    calendarGrid.style.gridTemplateColumns = `auto repeat(${cols},1fr)`;
    for (let r = 0; r < totalRows; r++) {
      const ph = document.createElement('div');
      ph.className = 'calendar-grid-cell';
      ph.style.background = 'transparent';
      ph.style.borderRight = '1px solid var(--color-border-default)';
      calendarGrid.appendChild(ph);
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-grid-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.addEventListener('click', () => {
          const minuteIndex = r * SLOT_MIN;
          const hour = Math.floor(minuteIndex / 60) + START_HOUR;
          const min = minuteIndex % 60;
          openCreateModal(new Date(currentDate), hour, min);
        });
        calendarGrid.appendChild(cell);
      }
    }
    const overlay = document.createElement('div');
    overlay.className = 'calendar-overlay';
    overlay.style.position = 'absolute';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.top = `${headerHeightPx}px`;
    overlay.style.bottom = '0';
    overlay.style.display = 'grid';
    overlay.style.gridTemplateColumns = `auto repeat(${cols}, 1fr)`;
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '2';
    overlay.appendChild(document.createElement('div'));
    DAY_OVERLAYS = [];
    for (let c = 0; c < cols; c++) {
      const dayCol = document.createElement('div');
      dayCol.style.position = 'relative';
      dayCol.style.height = '100%';
      dayCol.style.pointerEvents = 'none';
      overlay.appendChild(dayCol);
      DAY_OVERLAYS.push(dayCol);
    }
    calendarGrid.appendChild(overlay);
  }

  function getWeekDays() {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }

  function layoutOverlaps(dayEvents) {
    dayEvents.sort((a, b) => (a.startMin - b.startMin) || (a.endMin - b.endMin));
    let active = [];
    let clusterId = -1;
    let clusterMaxCols = {};
    let result = [];
    for (const e of dayEvents) {
      active = active.filter(x => x.endMin > e.startMin);
      if (active.length === 0) clusterId++;
      const used = new Set(active.map(x => x._col));
      let col = 0;
      while (used.has(col)) col++;
      e._col = col;
      e._cluster = clusterId;
      active.push(e);
      const maxCols = Math.max(...active.map(x => x._col + 1));
      clusterMaxCols[e._cluster] = Math.max(clusterMaxCols[e._cluster] || 0, maxCols);
      result.push(e);
    }
    result.forEach(e => e._colsInCluster = clusterMaxCols[e._cluster] || 1);
    return result;
  }

  function renderCards(daysOrDay) {
    const isWeek = Array.isArray(daysOrDay);
    const cols = isWeek ? daysOrDay.length : 1;
    DAY_OVERLAYS.forEach(col => col.innerHTML = '');
    const eventsByCol = Array.from({ length: cols }, () => []);
    (AGENDAS || []).forEach(a => {
      const start = parseLDT(a.dataHora);
      if (!start) return;
      let dayIndex = 0;
      if (isWeek) {
        dayIndex = daysOrDay.findIndex(d => isSameDay(d, start));
        if (dayIndex === -1) return;
      } else {
        if (!isSameDay(start, daysOrDay)) return;
        dayIndex = 0;
      }
      const fromMidnight = minutesFromStartOfDay(start);
      const startMin = Math.max(0, fromMidnight - START_HOUR * 60);
      const durMin = Math.max(0, Number(a.tempoTotal || 0));
      const endMin = Math.min(DAY_TOTAL_MINUTES, startMin + durMin);
      if (endMin <= 0 || startMin >= DAY_TOTAL_MINUTES) return;
      eventsByCol[dayIndex].push({ startMin, endMin, durMin: endMin - startMin, agenda: a, startDate: start });
    });
    const COL_GAP_PX = 4;
    eventsByCol.forEach((dayEvents, colIndex) => {
      const overlay = DAY_OVERLAYS[colIndex];
      if (!overlay) return;
      const laid = layoutOverlaps(dayEvents);
      laid.forEach(ev => {
        const a = ev.agenda;
        const topPct = (ev.startMin / DAY_TOTAL_MINUTES) * 100;
        const heightPct = Math.max((ev.durMin / DAY_TOTAL_MINUTES) * 100, 2);
        const widthPct = 100 / Math.max(1, ev._colsInCluster);
        const leftPct = widthPct * ev._col;
        const start = ev.startDate;
        const end = addMinutes(start, a.tempoTotal || 0);

        const saVisiveis = Array.isArray(a.servicosAgendados) ? a.servicosAgendados.filter(sa => Number(sa.status ?? 1) !== 2) : [];
        const clienteNome = a?.cliente?.nome ?? '—';
        const servicosTxt = saVisiveis.map(sa => sa?.servico?.descricao).filter(Boolean).join(', ');
        const prof = saVisiveis.map(sa => sa?.profissional?.nome).filter(Boolean)[0] ?? '—';
        const statusNum = Number(a.status);
        const statusTxt = statusNum === 2 ? 'Inativo' : (statusNum === 3 ? 'Concluído' : 'Ativo');

        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.style.position = 'absolute';
        card.style.top = `${topPct}%`;
        card.style.height = `${heightPct}%`;
        card.style.width = `calc(${widthPct}% - ${COL_GAP_PX}px)`;
        card.style.left = `calc(${leftPct}% + ${COL_GAP_PX / 2}px)`;
        card.style.pointerEvents = 'auto';
        card.style.zIndex = '3';
        if (statusNum === 2) card.classList.add('cancelled');
        if (statusNum === 3) card.classList.add('done');

        card.innerHTML = `
        <div class="appt-time">${pad2(start.getHours())}:${pad2(start.getMinutes())} - ${pad2(end.getHours())}:${pad2(end.getMinutes())}</div>
        <div class="appt-title">${prof}</div>
        <div class="appt-details">${clienteNome}${servicosTxt ? ' • ' + servicosTxt : ''} • R$ ${a.valorTotal?.toFixed(2) ?? '0.00'}</div>
        <div class="appt-status">${statusTxt}</div>
      `;
        card.addEventListener('click', (e) => { e.stopPropagation(); openEditModal(a.id); });
        overlay.appendChild(card);
      });
    });
  }


  function renderInternal() {
    renderTimeColumn();
    if (currentView === 'week') {
      const days = getWeekDays();
      if (periodLabel) periodLabel.textContent = formatPeriodWeek(days[0]);
      const headers = days.map(d => `<span class="day-name">${d.toLocaleDateString('pt-BR', { weekday: 'short' })}</span><span class="day-date">${pad2(d.getDate())}</span>`);
      buildGridHeaderAndCells(7, headers);
      renderCards(days);
    } else {
      const d = new Date(currentDate);
      d.setHours(0, 0, 0, 0);
      if (periodLabel) periodLabel.textContent = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      buildGridHeaderAndCells(1, [`<span class="day-name">${d.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>`]);
      renderCards(d);
    }
  }

  function render() { setActiveViewButtons(); renderInternal(); }

  async function refreshAndRender() {
    try {
      AGENDAS = await Api.Agendamentos.list();

      try {
        const novaLista = await Api.Catalogo.list().catch(() => null);
        if (Array.isArray(novaLista)) CATALOGOS = novaLista;
      } catch (e) {
        console.warn('Falha ao recarregar CATALOGOS', e);
      }

      const promises = (AGENDAS || []).map(async (a, idx) => {
        if (!Array.isArray(a.servicosAgendados) || a.servicosAgendados.length === 0) {
          try {
            const detalhe = await Api.Agendamentos.get(a.id);
            if (detalhe) {
              detalhe.servicosAgendados = Array.isArray(detalhe.servicosAgendados) ? detalhe.servicosAgendados : [];
              AGENDAS[idx] = detalhe;
            }
          } catch (e) {
            console.warn('Não foi possível carregar detalhe da agenda', a.id, e);
          }
        } else {
          AGENDAS[idx].servicosAgendados = Array.isArray(AGENDAS[idx].servicosAgendados) ? AGENDAS[idx].servicosAgendados : [];
        }
      });

      await Promise.all(promises);
      render();
    } catch (e) {
      console.error('Falha ao atualizar AGENDAS', e);
      AGENDAS = [];
      render();
    }
  }


  (async function init() {
    await loadInitialData();
    await refreshAndRender();
  })();

});