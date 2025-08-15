// src/main/resources/static/js/agendamentos.js
document.addEventListener("DOMContentLoaded", () => {
  // =========================================================
  // Boot: lê JSON injetado pelo Thymeleaf (application/json)
  // =========================================================
  function readJSON(id, fallback = []) {
    try { return JSON.parse(document.getElementById(id)?.textContent ?? "[]"); }
    catch (e) { console.error("Falha ao ler JSON", id, e); return fallback; }
  }
  const CLIENTES      = readJSON("clientes-data");
  const SERVICOS      = readJSON("servicos-data");
  const PROFISSIONAIS = readJSON("profissionais-data");

  // =========================================================
  // CSRF opcional (se o base.html tiver as <meta> do Security)
  // =========================================================
  function getCsrf() {
    const token  = document.querySelector('meta[name="_csrf"]')?.getAttribute("content");
    const header = document.querySelector('meta[name="_csrf_header"]')?.getAttribute("content");
    return (token && header) ? { token, header } : null;
  }

  // =========================================================
  // API helpers (JSON + fallbacks)
  // =========================================================
  async function doFetch(url, opts, contentType) {
    const headers = {
      "Accept": "application/json",
      ...(contentType ? { "Content-Type": contentType } : {}),
      ...(opts.headers || {})
    };
    const csrf = getCsrf();
    if (csrf) headers[csrf.header] = csrf.token;

    return fetch(url, { credentials: "same-origin", ...opts, headers });
  }

  async function fetchJSON(url, opts = {}) {
    const method = (opts.method || "GET").toUpperCase();
    const hasBody = ["POST", "PUT", "PATCH", "DELETE"].includes(method) && opts.body != null;

    // 1ª tentativa: application/json (sem charset)
    let resp = await doFetch(url, opts, hasBody ? "application/json" : undefined);

    // Fallback: se 415, tenta "application/json; charset=UTF-8"
    if (resp.status === 415 && hasBody) {
      resp = await doFetch(url, opts, "application/json; charset=UTF-8");
    }

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.error("[API ERROR]", resp.status, url, txt);
      const err = new Error(`${resp.status} : ${txt}`);
      err.status = resp.status;
      throw err;
    }
    return resp.status === 204 ? null : resp.json();
  }

  // POST/PUT fallback para MVC (x-www-form-urlencoded)
  async function postForm(url, paramsObj) {
    const csrf = getCsrf();
    const body = new URLSearchParams();
    Object.entries(paramsObj || {}).forEach(([k, v]) => body.append(k, v ?? ""));
    const headers = {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    };
    if (csrf) headers[csrf.header] = csrf.token;

    const resp = await fetch(url, { method: "POST", body, headers, credentials: "same-origin" });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.error("[FORM ERROR]", resp.status, url, txt);
      const err = new Error(`${resp.status} : ${txt}`);
      err.status = resp.status;
      throw err;
    }
    // resposta será HTML (redirect resolvido pelo fetch). Consideramos sucesso.
    return true;
  }

  const API = {
    listar:   () => fetchJSON("/api/agendamentos"),
    obter:    (id) => fetchJSON(`/api/agendamentos/${id}`),

    // cria via JSON; se 415, cai no /salvar (form-urlencoded)
    criar:    async (p) => {
      try {
        return await fetchJSON(`/api/agendamentos`, { method: "POST", body: JSON.stringify(p) });
      } catch (e) {
        if (e.status === 415 || e.status === 404 || e.status === 405) {
          // monta o form esperado pelo @ModelAttribute
          const fd = toAgendaFormParams(p);
          await postForm(`/agendamentos/salvar`, fd);
          return null;
        }
        throw e;
      }
    },

    // atualiza via JSON; se 415, cai no /{id}/atualizar (form-urlencoded)
    atualizar: async (id, p) => {
      try {
        return await fetchJSON(`/api/agendamentos/${id}`, { method: "PUT", body: JSON.stringify(p) });
      } catch (e) {
        if (e.status === 415 || e.status === 404 || e.status === 405) {
          const fd = toAgendaFormParams({ ...p, id });
          await postForm(`/agendamentos/${id}/atualizar`, fd);
          return null;
        }
        throw e;
      }
    },

    // inativar via DELETE; se falhar, cai no GET /excluir
    inativar: async (id) => {
      try {
        return await fetchJSON(`/api/agendamentos/${id}`, { method: "DELETE" });
      } catch (e) {
        if (e.status === 404 || e.status === 405) {
          const resp = await fetch(`/agendamentos/${id}/excluir`, { credentials: "same-origin" });
          if (!resp.ok) throw e;
          return null;
        }
        throw e;
      }
    },

    profDisp: (inicioISOWithOffset, duracaoMin, servicoId) => {
      const url = new URL(location.origin + `/api/agendamentos/profissionais-disponiveis`);
      url.searchParams.set("inicio", inicioISOWithOffset);     // ex: 2025-08-10T07:00:00-03:00
      url.searchParams.set("duracaoMin", String(duracaoMin));
      if (servicoId) url.searchParams.set("servicoId", String(servicoId));
      return fetchJSON(url.toString());
    }
  };

  // monta mapa de campos para o @ModelAttribute do MVC
  function toAgendaFormParams(p) {
    const fd = {};
    if (p.id) fd["id"] = String(p.id);
    fd["cliente.id"] = String(p?.cliente?.id ?? "");
    fd["dataHora"]   = String(p.dataHora ?? "");
    fd["tempoTotal"] = String(p.tempoTotal ?? "");
    fd["valorTotal"] = String(p.valorTotal ?? "");
    fd["status"]     = String(p.status ?? "1");

    const sa = (p.servicosAgendados && p.servicosAgendados[0]) ? p.servicosAgendados[0] : null;
    if (sa) {
      fd["servicosAgendados[0].servico.id"]     = String(sa?.servico?.id ?? "");
      fd["servicosAgendados[0].profissional.id"]= String(sa?.profissional?.id ?? "");
      fd["servicosAgendados[0].status"]         = String(sa?.status ?? "1");
    }
    return fd;
  }

  // =========================================================
  // Elementos / Modal / Toolbar
  // =========================================================
  const calendarGrid = document.getElementById("calendar-main-grid");
  const timeColumn   = document.querySelector(".time-column");
  const periodLabel  = document.getElementById("current-period-display");
  const btnPrev  = document.getElementById("prev-week-btn");
  const btnNext  = document.getElementById("next-week-btn");
  const btnToday = document.getElementById("today-btn");
  const btnWeek  = document.getElementById("week-view-btn");
  const btnDay   = document.getElementById("day-view-btn");
  const btnAdd   = document.getElementById("add-agenda-btn");

  const modal       = document.getElementById("agendamento-modal");
  const modalTitle  = document.getElementById("modal-title");
  const btnClose    = document.getElementById("modal-close");
  const btnCancelar = document.getElementById("modal-cancelar");
  const btnInativar = document.getElementById("modal-inativar");

  const form            = document.getElementById("agendamento-form");
  const fieldId         = document.getElementById("agenda-id");
  const selCliente      = document.getElementById("agendamento-cliente");
  const selServico      = document.getElementById("agendamento-servico");
  const infoServico     = document.getElementById("servico-info");
  const selProf         = document.getElementById("agendamento-profissional");
  const inpData         = document.getElementById("agendamento-data");
  const inpHora         = document.getElementById("agendamento-hora");
  const selStatus       = document.getElementById("agendamento-status");
  const hiddenValor     = document.getElementById("agenda-valor-hidden");
  const hiddenDuracao   = document.getElementById("agenda-duracao-hidden");

  // =========================================================
  // Estado / Utils
  // =========================================================
  const START_HOUR = 7, END_HOUR = 18, SLOT_MIN = 30;
  let currentView = "week";
  let currentDate = new Date();
  let AGENDAS = [];

  const pad2 = (n)=> String(n).padStart(2,"0");
  const minutesFromStartOfDay = (d)=> d.getHours()*60 + d.getMinutes();
  const isSameDay = (a,b)=> a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();

  function parseLDT(iso){
    if (!iso) return null;
    const [d,t]=String(iso).split("T");
    if (!d || !t) return new Date(iso);
    const [y,m,day]=d.split("-").map(Number);
    const [hh,mm="0",ss="0"]=t.split(":").map(Number);
    return new Date(y,(m-1),day,hh,mm,ss);
  }
  function startOfWeek(date){ const d=new Date(date), wd=d.getDay(), diff=(wd===0?-6:1-wd); d.setDate(d.getDate()+diff); d.setHours(0,0,0,0); return d; }
  function formatPeriodWeek(start){ const end=new Date(start); end.setDate(start.getDate()+6); const s=start.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}); const e=end.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}); return `${s} – ${e} de ${end.getFullYear()}`; }
  function toISO(dateStr,time){ return `${dateStr}T${time}:00`; } // LocalDateTime (sem offset)
  function toISOWithOffset(dateStr, timeStr) {
    const [Y,M,D] = dateStr.split("-").map(Number);
    const [H,Min] = timeStr.split(":").map(Number);
    const d = new Date(Y, (M-1), D, H, Min ?? 0, 0, 0); // local
    const offMin = -d.getTimezoneOffset();
    const sign   = offMin >= 0 ? "+" : "-";
    const abs    = Math.abs(offMin);
    const hh     = pad2(Math.floor(abs/60));
    const mm     = pad2(abs % 60);
    return `${Y}-${pad2(M)}-${pad2(D)}T${pad2(H)}:${pad2(Min)}:00${sign}${hh}:${mm}`;
  }

  // =========================================================
  // Selects (preenchimento garantido)
  // =========================================================
  function fillClientes() {
    selCliente.innerHTML = `<option value="">Selecione um cliente</option>`;
    (Array.isArray(CLIENTES) ? CLIENTES : []).forEach(c => {
      const opt = document.createElement("option");
      opt.value = String(c.id);
      opt.textContent = `${c.id} — ${c.nome ?? c.nomeFantasia ?? "Sem nome"}`;
      selCliente.appendChild(opt);
    });
  }
  function fillServicos() {
    selServico.innerHTML = `<option value="">Selecione um serviço</option>`;
    (Array.isArray(SERVICOS) ? SERVICOS : []).forEach(s => {
      const opt = document.createElement("option");
      opt.value = String(s.id);
      opt.textContent = `${s.descricao}${s.tempoMedio?` (${s.tempoMedio} min)`:''}`;
      selServico.appendChild(opt);
    });
  }
  fillClientes();
  fillServicos();

  // =========================================================
  // Modal
  // =========================================================
  function showModal(open){ modal.style.display = open ? "flex" : "none"; }

  function openCreateModal(prefillDate=new Date(), hour=null, minute=0) {
    modalTitle.textContent = "Agendar Serviço";
    fieldId.value = "";
    btnInativar.style.display = "none";

    selCliente.value = "";
    selServico.value = "";
    selProf.innerHTML = `<option value="">Selecione um profissional</option>`;
    selProf.disabled = true;

    infoServico.textContent = "";
    hiddenDuracao.value = "";
    hiddenValor.value = "";
    selStatus.value = "1";

    inpData.value = `${prefillDate.getFullYear()}-${pad2(prefillDate.getMonth()+1)}-${pad2(prefillDate.getDate())}`;
    inpHora.value = (hour != null) ? `${pad2(hour)}:${pad2(minute)}` : "08:00";

    showModal(true);
  }

  async function openEditModal(id) {
    try {
      const a = await API.obter(id);
      modalTitle.textContent = `Editar Agendamento #${a.id}`;
      fieldId.value = a.id;
      btnInativar.style.display = "inline-flex";

      selCliente.value = a?.cliente?.id ? String(a.cliente.id) : "";
      const sa = (a.servicosAgendados || [])[0];
      selServico.value = sa?.servico?.id ? String(sa.servico.id) : "";
      onServicoChange();

      const dt = parseLDT(a.dataHora) || new Date();
      inpData.value = `${dt.getFullYear()}-${pad2(dt.getMonth()+1)}-${pad2(dt.getDate())}`;
      inpHora.value = `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
      selStatus.value = String(a.status ?? 1);

      await updateAvailableProfessionals();
      if (sa?.profissional?.id) selProf.value = String(sa.profissional.id);

      showModal(true);
    } catch (e) {
      console.error(e);
      alert("Não foi possível abrir o agendamento.");
    }
  }

  function closeModal(){ showModal(false); }
  btnClose.addEventListener("click", closeModal);
  btnCancelar.addEventListener("click", (e)=>{ e.preventDefault(); closeModal(); });
  modal.addEventListener("click", (e)=>{ if (e.target === modal) closeModal(); });

  function onServicoChange() {
    const id = Number(selServico.value || 0);
    const s  = SERVICOS.find(x => Number(x.id) === id);
    if (s) {
      hiddenDuracao.value = String(s.tempoMedio ?? 30);
      hiddenValor.value   = String(s.valor ?? 0);
      const valorFmt = (typeof s.valor === "number") ? s.valor.toFixed(2) : (s.valor ?? "0");
      infoServico.textContent = `Duração: ${s.tempoMedio ?? 30} min · Valor estimado: R$ ${valorFmt}`;
    } else {
      hiddenDuracao.value = "";
      hiddenValor.value = "";
      infoServico.textContent = "";
    }
  }
  selServico.addEventListener("change", async () => { onServicoChange(); await updateAvailableProfessionals(); });
  inpData  .addEventListener("change", updateAvailableProfessionals);
  inpHora  .addEventListener("change", updateAvailableProfessionals);

  async function updateAvailableProfessionals() {
    selProf.innerHTML = `<option value="">Selecione um profissional</option>`;
    const servicoId = Number(selServico.value || 0);
    const data      = inpData.value;
    const hora      = inpHora.value;
    const dur       = Number(hiddenDuracao.value || 0);

    if (!servicoId || !data || !hora || !dur) { selProf.disabled = true; return; }

    try {
      const inicioParam = toISOWithOffset(data, hora); // ex.: 2025-08-10T07:00:00-03:00
      const disponiveis = await API.profDisp(inicioParam, dur, servicoId);
      if (!Array.isArray(disponiveis) || disponiveis.length === 0) {
        selProf.innerHTML = `<option value="">Nenhum profissional disponível</option>`;
        selProf.disabled = true;
        return;
      }
      selProf.disabled = false;
      disponiveis.forEach(p => {
        const opt=document.createElement("option");
        opt.value = String(p.id);
        opt.textContent = p.nome;
        selProf.appendChild(opt);
      });
    } catch (err) {
      console.error("Falha ao obter disponibilidade:", err);
      selProf.innerHTML = `<option value="">Erro ao carregar disponibilidade</option>`;
      selProf.disabled = true;
    }
  }

  btnInativar.addEventListener("click", async () => {
    const id = Number(fieldId.value || 0);
    if (!id) return;
    if (!confirm(`Inativar Agendamento #${id}?`)) return;
    try {
      await API.inativar(id);
      closeModal();
      await refreshAndRender();
    } catch (e) {
      console.error(e);
      alert("Falha ao inativar.");
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id        = Number(fieldId.value || 0);
    const clienteId = Number(selCliente.value || 0);
    const servicoId = Number(selServico.value || 0);
    const profId    = Number(selProf.value || 0);
    const data      = inpData.value;
    const hora      = inpHora.value;
    const status    = Number(selStatus.value || 1);
    const dur       = Number(hiddenDuracao.value || 0);
    const valor     = Number(hiddenValor.value || 0);

    if (!clienteId || !servicoId || !profId || !data || !hora || !dur) {
      alert("Preencha Cliente, Serviço, Profissional, Data, Hora.");
      return;
    }

    const payload = {
      id: id || null,
      cliente: { id: clienteId },
      dataHora: toISO(data, hora), // LocalDateTime (sem offset)
      tempoTotal: dur,
      valorTotal: valor,
      status: status,
      servicosAgendados: [{
        servico: { id: servicoId },
        profissional: { id: profId },
        status: 1
      }]
    };

    try {
      if (!id) await API.criar(payload);
      else      await API.atualizar(id, payload);

      closeModal();
      await refreshAndRender();
    } catch (e) {
      console.error(e);
      alert("Falha ao salvar. Veja o console.");
    }
  });

  // =========================================================
  // Calendário (Semana/Dia)
  // =========================================================
  function renderTimeColumn(){
    timeColumn.innerHTML = "";
    const totalSlots=(END_HOUR-START_HOUR)*(60/SLOT_MIN);
    for (let i=0;i<=totalSlots;i++){
      const mins=i*SLOT_MIN, h=Math.floor(mins/60)+START_HOUR, m=mins%60;
      const div=document.createElement("div");
      div.className="time-slot-label";
      div.textContent=`${pad2(h)}:${pad2(m)}`;
      timeColumn.appendChild(div);
    }
  }

  function buildGridHeaderAndCells(cols, headers){
    calendarGrid.innerHTML = "";

    // Canto (alinha com a coluna de horários)
    const corner = document.createElement("div");
    corner.className = "grid-header-corner";
    calendarGrid.appendChild(corner);

    // Cabeçalhos dos dias
    for (let c=0;c<cols;c++){
      const hd=document.createElement("div");
      hd.className="calendar-day-header";
      hd.innerHTML=headers[c];
      calendarGrid.appendChild(hd);
    }

    // Linhas de células
    const totalRows=(END_HOUR-START_HOUR)*(60/SLOT_MIN);
    calendarGrid.style.gridTemplateColumns=`auto repeat(${cols},1fr)`;
    for (let r=0;r<totalRows;r++){
      const ph=document.createElement("div");
      ph.className="calendar-grid-cell";
      ph.style.background="transparent";
      ph.style.borderRight="1px solid var(--border-color)";
      calendarGrid.appendChild(ph);

      for (let c=0;c<cols;c++){
        const cell=document.createElement("div");
        cell.className="calendar-grid-cell";
        cell.dataset.row=r; cell.dataset.col=c;
        // clique em célula abre modal já com data/hora
        cell.addEventListener("click",()=> {
          const hour=Math.floor((r*SLOT_MIN)/60)+START_HOUR;
          const min=(r*SLOT_MIN)%60;
          openCreateModal(new Date(currentDate), hour, min);
        });
        calendarGrid.appendChild(cell);
      }
    }
  }

  // indexador levando em conta a coluna "tempo" (placeholder) por linha
  const cellIndex=(row,col,cols)=> (row*(cols+1)) + 1 + col;

  function getWeekDays(){
    const start = startOfWeek(currentDate);
    return Array.from({length:7},(_,i)=>{const d=new Date(start); d.setDate(start.getDate()+i); return d;});
  }

  function renderCardsWeek(days){
    const cols=days.length;
    const cells=[...calendarGrid.querySelectorAll(".calendar-grid-cell")];

    (AGENDAS || []).forEach(a=>{
      const start=parseLDT(a.dataHora); if(!start) return;
      const col=days.findIndex(d=>isSameDay(d,start)); if(col===-1) return;

      const totalMin=minutesFromStartOfDay(start)-START_HOUR*60; if(totalMin<0) return;
      const row=Math.floor(totalMin/SLOT_MIN);
      const topPct=((totalMin%SLOT_MIN)/SLOT_MIN)*100;
      const durMin=Number(a.tempoTotal||0);
      const heightPct=Math.max(20,(durMin/SLOT_MIN)*100);

      const idx=cellIndex(row,col,cols);
      const target=cells[idx]; if(!target) return;

      const clienteNome=a?.cliente?.nome ?? "—";
      const servicosTxt=(a.servicosAgendados||[]).map(sa=>sa?.servico?.descricao).filter(Boolean).join(", ");
      const profsTxt=(a.servicosAgendados||[]).map(sa=>sa?.profissional?.nome).filter(Boolean).join(", ");

      const card=document.createElement("div");
      card.className="appointment-card";
      card.style.top=`${topPct}%`;
      card.style.height=`${heightPct}%`;
      card.innerHTML=`
        <div class="appt-time">${pad2(start.getHours())}:${pad2(start.getMinutes())}</div>
        <div class="appt-title">${servicosTxt || "Agendamento"}</div>
        <div class="appt-details">${clienteNome}${profsTxt ? " • "+profsTxt : ""}</div>
      `;
      card.addEventListener("click",(e)=>{ e.stopPropagation(); openEditModal(a.id); });
      target.appendChild(card);
    });
  }

  function renderCardsDay(day){
    const cols=1;
    const cells=[...calendarGrid.querySelectorAll(".calendar-grid-cell")];

    (AGENDAS || []).forEach(a=>{
      const start=parseLDT(a.dataHora); if(!start || !isSameDay(start,day)) return;

      const totalMin=minutesFromStartOfDay(start)-START_HOUR*60; if(totalMin<0) return;
      const row=Math.floor(totalMin/SLOT_MIN);
      const topPct=((totalMin%SLOT_MIN)/SLOT_MIN)*100;
      const durMin=Number(a.tempoTotal||0);
      const heightPct=Math.max(20,(durMin/SLOT_MIN)*100);

      const idx=cellIndex(row,0,cols);
      const target=cells[idx]; if(!target) return;

      const clienteNome=a?.cliente?.nome ?? "—";
      const servicosTxt=(a.servicosAgendados||[]).map(sa=>sa?.servico?.descricao).filter(Boolean).join(", ");
      const profsTxt=(a.servicosAgendados||[]).map(sa=>sa?.profissional?.nome).filter(Boolean).join(", ");

      const card=document.createElement("div");
      card.className="appointment-card";
      card.style.top=`${topPct}%`;
      card.style.height=`${heightPct}%`;
      card.innerHTML=`
        <div class="appt-time">${pad2(start.getHours())}:${pad2(start.getMinutes())}</div>
        <div class="appt-title">${servicosTxt || "Agendamento"}</div>
        <div class="appt-details">${clienteNome}${profsTxt ? " • "+profsTxt : ""}</div>
      `;
      card.addEventListener("click",(e)=>{ e.stopPropagation(); openEditModal(a.id); });
      target.appendChild(card);
    });
  }

  async function render(){
    renderTimeColumn();

    if (currentView==="week"){
      const days=getWeekDays();
      periodLabel.textContent = formatPeriodWeek(days[0]);

    const headers=days.map(d=>`<span class="day-name">${d.toLocaleDateString("pt-BR",{weekday:"short"})}</span><span class="day-date" data-day="${d.toISOString()}">${pad2(d.getDate())}</span>`);
      buildGridHeaderAndCells(7, headers);

      renderCardsWeek(days);
    } else {
      const d=new Date(currentDate); d.setHours(0,0,0,0);
      periodLabel.textContent = d.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });

      buildGridHeaderAndCells(1, [ `<span class="day-name">${d.toLocaleDateString("pt-BR",{weekday:"short"})}</span>` ]);
      renderCardsDay(d);
    }
  }

  // =========================================================
  // Navegação / inicialização
  // =========================================================
  btnPrev .addEventListener("click", async ()=>{ currentDate.setDate(currentDate.getDate() + (currentView==="week" ? -7 : -1)); await render(); });
  btnNext .addEventListener("click", async ()=>{ currentDate.setDate(currentDate.getDate() + (currentView==="week" ? +7 : +1)); await render(); });
  btnToday.addEventListener("click", async ()=>{ currentDate = new Date(); await render(); });
  btnWeek .addEventListener("click", async ()=>{ currentView="week"; btnWeek.classList.add("active"); btnDay.classList.remove("active"); await render(); });
  btnDay  .addEventListener("click", async ()=>{ currentView="day";  btnDay .classList.add("active"); btnWeek.classList.remove("active"); await render(); });
  btnAdd  .addEventListener("click", ()=> openCreateModal(currentDate) );

  async function refreshAndRender(){ AGENDAS = await API.listar(); await render(); }

  (async function init(){
    await refreshAndRender();
  })();
});
