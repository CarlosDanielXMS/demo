// Minimal CRUD helper to power modals in templates.
// It reads injected JSON (id like clientes-data, servicos-data, profissionais-data, catalogo-data)
// and wires add/edit/delete operations against the REST API under /api/*.

function readJSON(id, fallback = []) {
  try { return JSON.parse(document.getElementById(id)?.textContent ?? "[]"); } catch (e) { return fallback; }
}

async function fetchJSON(url, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  const hasBody = ['POST','PUT','PATCH','DELETE'].includes(method) && opts.body != null;
  async function doFetch(contentType) {
    const headers = { 'Accept': 'application/json', ...(contentType ? { 'Content-Type': contentType } : {}), ...(opts.headers||{}) };
    return fetch(url, { credentials: 'same-origin', ...opts, headers });
  }
  let resp = await doFetch(hasBody ? 'application/json' : undefined);
  if (resp.status === 415 && hasBody) {
    resp = await doFetch('application/json; charset=UTF-8');
  }
  if (!resp.ok) {
    const txt = await resp.text().catch(()=>'');
    const err = new Error(`${resp.status} : ${txt}`);
    err.status = resp.status;
    throw err;
  }
  return resp.status === 204 ? null : resp.json();
}

document.addEventListener('DOMContentLoaded', () => {
  // Generic helpers
  const CLIENTES = readJSON('clientes-data');
  const PROFISSIONAIS = readJSON('profissionais-data');
  const SERVICOS = readJSON('servicos-data');
  const CATALOGOS = readJSON('catalogo-data');

  // --- Clientes page wiring
  const addClienteBtn = document.getElementById('add-cliente-btn');
  const clienteModal = document.getElementById('cliente-modal');
  if (addClienteBtn && clienteModal) {
    const form = document.getElementById('cliente-form');
    const cancel = document.getElementById('cliente-cancel');
    const openModal = () => clienteModal.style.display = 'flex';
    const closeModal = () => clienteModal.style.display = 'none';
    addClienteBtn.addEventListener('click', () => { form.reset(); openModal(); });
    cancel.addEventListener('click', closeModal);

    // edit buttons
        document.querySelectorAll('.edit-cliente-btn').forEach(b=>b.addEventListener('click', async (e)=>{
      const id = b.getAttribute('data-id');
      if (!id) return;
      try {
        const json = await fetchJSON(`/api/clientes/${id}`);
        const nomeEl = form.querySelector('#nome'); if (nomeEl) nomeEl.value = json.nome || '';
        const telEl = form.querySelector('#telefone'); if (telEl) telEl.value = json.telefone || '';
        const emailEl = form.querySelector('#email'); if (emailEl) emailEl.value = json.email || '';
        // set hidden id field if present
        const idField = form.querySelector('input[name="id"]') || form.querySelector('input[type=hidden]');
        if (idField) idField.value = json.id;
        openModal();
      } catch (err) { console.error(err); alert('Falha ao carregar cliente'); }
    }));

    // delete buttons
    document.querySelectorAll('.delete-cliente-btn').forEach(b=>b.addEventListener('click', async ()=>{
      const id = b.getAttribute('data-id');
      if (!id || !confirm('Confirmar inativação?')) return;
      try { await fetchJSON(`/api/clientes/${id}`, { method: 'DELETE' }); location.reload(); }
      catch (e){ console.error(e); alert('Falha ao inativar'); }
    }));

    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const data = new FormData(form);
      const obj = Object.fromEntries(data.entries());
      const id = form.querySelector('input[name="id"]')?.value;
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/clientes/${id}` : '/api/clientes';
      try {
        await fetchJSON(url, { method, body: JSON.stringify(obj) });
        closeModal();
        location.reload();
      } catch (e){ console.error(e); alert('Falha ao salvar'); }
    });
  }

  // --- Profissionais wiring (same pattern)
  const addProfBtn = document.getElementById('add-profissional-btn');
  const profModal = document.getElementById('profissional-modal');
  if (addProfBtn && profModal) {
    const form = document.getElementById('profissional-form');
    const cancel = document.getElementById('profissional-cancel');
    const openModal = () => profModal.style.display = 'flex';
    const closeModal = () => profModal.style.display = 'none';
    addProfBtn.addEventListener('click', () => { form.reset(); openModal(); });
    cancel.addEventListener('click', closeModal);

        document.querySelectorAll('.edit-profissional-btn').forEach(b=>b.addEventListener('click', async ()=>{
      const id = b.getAttribute('data-id'); if (!id) return;
      try {
        const json = await fetchJSON(`/api/profissionais/${id}`);
        const nomeEl = form.querySelector('#nome'); if (nomeEl) nomeEl.value = json.nome || '';
        const telEl = form.querySelector('#telefone'); if (telEl) telEl.value = json.telefone || '';
        const emailEl = form.querySelector('#email'); if (emailEl) emailEl.value = json.email || '';
        const salEl = form.querySelector('#salarioFixo'); if (salEl) salEl.value = json.salarioFixo ?? '';
        const comEl = form.querySelector('#comissao'); if (comEl) comEl.value = json.comissao ?? '';
        const idEl = form.querySelector('input[name="id"]'); if (idEl) idEl.value = json.id;
        openModal();
      } catch (e){ console.error(e); alert('Falha ao carregar profissional'); }
    }));
    document.querySelectorAll('.delete-profissional-btn').forEach(b=>b.addEventListener('click', async ()=>{
      const id = b.getAttribute('data-id'); if (!id || !confirm('Confirmar?')) return; const r = await fetch(`/api/profissionais/${id}`,{method:'DELETE'}); if(!r.ok) return alert('Falha'); location.reload();
    }));
  form.addEventListener('submit', async (ev)=>{ ev.preventDefault(); const id = form.querySelector('input[name="id"]')?.value; const obj = Object.fromEntries(new FormData(form).entries()); const url = id?`/api/profissionais/${id}`:'/api/profissionais'; const method = id?'PUT':'POST'; try { await fetchJSON(url,{method, body: JSON.stringify(obj)}); closeModal(); location.reload(); } catch(e){ console.error(e); alert('Falha ao salvar profissional'); } });
  }

  // --- Serviços wiring
  const addServBtn = document.getElementById('add-servico-btn');
  const servModal = document.getElementById('servico-modal');
  if (addServBtn && servModal) {
    const form = document.getElementById('servico-form');
    const cancel = document.getElementById('servico-cancel');
    const openModal = () => servModal.style.display = 'flex';
    const closeModal = () => servModal.style.display = 'none';
    addServBtn.addEventListener('click', () => { form.reset(); openModal(); });
    cancel.addEventListener('click', closeModal);

        document.querySelectorAll('.edit-servico-btn').forEach(b=>b.addEventListener('click', async ()=>{
      const id = b.getAttribute('data-id'); if(!id) return; try { const j = await fetchJSON(`/api/servicos/${id}`); const d = form.querySelector('#descricao'); if (d) d.value = j.descricao || ''; const v = form.querySelector('#valor'); if (v) v.value = j.valor ?? ''; const t = form.querySelector('#tempoMedio'); if (t) t.value = j.tempoMedio ?? ''; const idIn = form.querySelector('input[name="id"]'); if (idIn) idIn.value = j.id; openModal(); } catch(e){ console.error(e); alert('Falha ao carregar serviço'); }
    }));
    document.querySelectorAll('.delete-servico-btn').forEach(b=>b.addEventListener('click', async ()=>{ const id = b.getAttribute('data-id'); if(!id||!confirm('Confirmar?')) return; const r = await fetch(`/api/servicos/${id}`,{method:'DELETE'}); if(!r.ok) return alert('Falha'); location.reload(); }));
  form.addEventListener('submit', async (ev)=>{ ev.preventDefault(); const id = form.querySelector('input[name="id"]')?.value; const obj = Object.fromEntries(new FormData(form).entries()); const url = id?`/api/servicos/${id}`:'/api/servicos'; const method = id?'PUT':'POST'; try { await fetchJSON(url,{method, body: JSON.stringify(obj)}); closeModal(); location.reload(); } catch(e){ console.error(e); alert('Falha ao salvar serviço'); } });
  }

  // --- Catalogo wiring (basic)
  const addCatBtn = document.getElementById('add-catalogo-btn');
  const catModal = document.getElementById('catalogo-modal');
  if (addCatBtn && catModal) {
    const form = document.getElementById('catalogo-form');
    const cancel = document.getElementById('catalogo-cancel');
    const openModal = () => catModal.style.display = 'flex';
    const closeModal = () => catModal.style.display = 'none';
    addCatBtn.addEventListener('click', () => { form.reset(); openModal(); });
    cancel.addEventListener('click', closeModal);

    // delete/edit catalogo buttons require combined ids
    document.querySelectorAll('.delete-catalogo-btn').forEach(b=>b.addEventListener('click', async ()=>{
      const idProf = b.getAttribute('data-id-prof');
      const idServ = b.getAttribute('data-id-serv');
      if(!idProf || !idServ || !confirm('Confirmar exclusão?')) return;
      const r = await fetch(`/api/catalogo/${idProf}/${idServ}`, { method: 'DELETE' });
      if(!r.ok) return alert('Falha'); location.reload();
    }));
    document.querySelectorAll('.edit-catalogo-btn').forEach(b=>b.addEventListener('click', async ()=>{
      // optional: fetch specific catalogo
      openModal();
    }));

    // when profissional/servico change, fill defaults from selected servico
    const profSel = form.querySelector('#profissional');
    const servSel = form.querySelector('#servico');
    const valorInp = form.querySelector('#valor');
    const tempoInp = form.querySelector('#tempoMedio');
    function applyServicoDefaults(){
      const sid = Number(servSel.value || 0);
      const serv = SERVICOS.find(s=>Number(s.id)===sid);
      if (serv) {
        if (valorInp && (!valorInp.value || valorInp.value === '')) valorInp.value = serv.valor ?? '';
        if (tempoInp && (!tempoInp.value || tempoInp.value === '')) tempoInp.value = serv.tempoMedio ?? '';
      }
    }
    servSel?.addEventListener('change', applyServicoDefaults);

    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      // convert flat FormData into nested Catalogo payload expected by the controller
      const fdObj = Object.fromEntries(new FormData(form).entries());
      const payload = {
        profissional: { id: Number(fdObj['profissional.id'] || fdObj['idProf'] || 0) },
        servico: { id: Number(fdObj['servico.id'] || fdObj['idServ'] || 0) },
        valor: fdObj.valor ? Number(fdObj.valor) : null,
        tempoMedio: fdObj.tempoMedio ? Number(fdObj.tempoMedio) : null,
        status: fdObj.status ? Number(fdObj.status) : 1
      };
      try {
        let r = await fetch('/api/catalogo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        if (r.status===415) {
          const body = new URLSearchParams(); Object.entries(fdObj).forEach(([k,v])=>body.append(k,v||""));
          r = await fetch('/catalogo',{method:'POST',body});
        }
        if(!r.ok) throw new Error('fail'); closeModal(); location.reload();
      } catch(e){ console.error(e); alert('Falha'); }
    });

    // simple search/filter for catalogo table
    const searchBox = document.getElementById('search-catalogo');
    const filterStatus = document.getElementById('filter-catalogo-status');
    if (searchBox) searchBox.addEventListener('input', ()=>{ const q = searchBox.value.trim().toLowerCase(); document.querySelectorAll('#catalogo-table tbody tr').forEach(tr=>{ const txt = tr.textContent.toLowerCase(); tr.style.display = q && !txt.includes(q) ? 'none' : ''; }); });

  // --- generic search handlers for clientes, profissionais, servicos
  const makeSearch = (boxId, tableSelector) => {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.addEventListener('input', ()=>{
      const q = box.value.trim().toLowerCase();
      document.querySelectorAll(`${tableSelector} tbody tr`).forEach(tr=>{ const txt = tr.textContent.toLowerCase(); tr.style.display = q && !txt.includes(q) ? 'none' : ''; });
    });
  };
  makeSearch('search-cliente', 'table.data-table');
  makeSearch('search-profissional', 'table.data-table');
  makeSearch('search-servico', 'table.data-table');
  }
});
