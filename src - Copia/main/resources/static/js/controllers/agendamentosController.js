document.addEventListener("DOMContentLoaded", () => {
  const { Api, Dom, Modal, Modules } = window.App;
  const { ServicosAgendados } = Modules;

  // ===== Dados injetados pelo HTML =====
  const CLIENTES      = Dom.readJsonScript("clientes-data");
  const SERVICOS      = Dom.readJsonScript("servicos-data");
  const PROFISSIONAIS = Dom.readJsonScript("profissionais-data");

  // ===== Referências de UI =====
  const calendarGrid = Dom.qs("#calendar-main-grid");
  const timeColumn   = Dom.qs(".time-column");
  const periodLabel  = Dom.qs("#current-period-display");

  const btnPrev  = Dom.qs("#prev-week-btn");
  const btnNext  = Dom.qs("#next-week-btn");
  const btnToday = Dom.qs("#today-btn");
  const btnWeek  = Dom.qs("#week-view-btn");
  const btnDay   = Dom.qs("#day-view-btn");
  const btnAdd   = Dom.qs("#add-agenda-btn");

  // Modal & form
  const modal       = Dom.qs("#agendamento-modal");
  const modalTitle  = Dom.qs("#modal-title");
  const btnCancelar = Dom.qs("#modal-cancelar");
  const btnInativar = Dom.qs("#modal-inativar");
  const form        = Dom.qs("#agendamento-form");

  const fieldId     = Dom.qs("#agenda-id");
  const selCliente  = Dom.qs("#agendamento-cliente");
  const inpData     = Dom.qs("#agendamento-data");
  const inpHora     = Dom.qs("#agendamento-hora");
  const selStatus   = Dom.qs("#agendamento-status");

  const totalDurEl  = Dom.qs("#total-duracao");
  const totalValEl  = Dom.qs("#total-valor");
  const hiddenValor   = Dom.qs("#agenda-valor-hidden");
  const hiddenDuracao = Dom.qs("#agenda-duracao-hidden");

  const saList = Dom.qs("#sa-list");
  const saAdd  = Dom.qs("#sa-add");

  // ===== Constantes/estado =====
  const START_HOUR = 7;       // 07:00
  const END_HOUR   = 18;      // 18:00
  const SLOT_MIN   = 30;      // tamanho do slot
  const DAY_TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

  let currentView = "day";    // Começa na VISÃO DO DIA
  let currentDate = new Date();
  let AGENDAS     = [];

  let DAY_OVERLAYS = [];      // colunas absolutas para os cards

  // ===== Utils =====
  const pad2 = (n)=> String(n).padStart(2,"0");
  const minutesFromStartOfDay = (d)=> d.getHours()*60 + d.getMinutes();
  const isSameDay = (a,b)=> a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  const addMinutes = (date, minutes)=> { const d = new Date(date); d.setMinutes(d.getMinutes() + minutes); return d; };

  function parseLDT(iso){
    if (!iso) return null;
    const [d,t]=String(iso).split("T");
    if (!d || !t) return new Date(iso);
    const [y,m,day]=d.split("-").map(Number);
    const [hh,mm="0",ss="0"]=t.split(":").map(Number);
    return new Date(y,(m-1),day,hh,mm,ss);
  }
  function toISO(dateStr,time){ return `${dateStr}T${time}`; }
  function startOfWeek(date){ const d=new Date(date), wd=d.getDay(), diff=(wd===0?-6:1-wd); d.setDate(d.getDate()+diff); d.setHours(0,0,0,0); return d; }
  function formatPeriodWeek(start){ const end=new Date(start); end.setDate(start.getDate()+6); const s=start.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}); const e=end.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}); return `${s} – ${e} de ${end.getFullYear()}`; }

  // ===== Select Cliente =====
  function fillClientes() {
    selCliente.innerHTML = `<option value="">Selecione um cliente</option>`;
    (CLIENTES || []).forEach(c => {
      const opt = document.createElement("option");
      opt.value = String(c.id);
      opt.textContent = `${c.id} — ${c.nome ?? c.nomeFantasia ?? "Sem nome"}`;
      selCliente.appendChild(opt);
    });
  }
  fillClientes();

  // ===== Lista de Serviços Agendados =====
  function getSaRows(){ return Array.from(saList.querySelectorAll(".sa-row")); }

  function recalcTotals(){
    const rows = getSaRows();
    const { minutos, valor } = ServicosAgendados.sumTotals(rows);
    hiddenDuracao.value = String(minutos);
    hiddenValor.value   = String(valor.toFixed(2));
    totalDurEl.textContent = `Duração total: ${minutos} min`;
    totalValEl.textContent = `Valor total: R$ ${valor.toFixed(2)}`;
  }

  async function loadDisponibilidadeAll(){
    const data = inpData.value, hora = inpHora.value;
    for (const r of getSaRows()) {
      await r.loadDisponibilidade({ data, hora });
    }
  }

  function clearSaList(){ saList.innerHTML = ""; recalcTotals(); }
  function addSaRow(initial = {}) {
    const row = ServicosAgendados.createRow({ SERVICOS }, initial);
    row.addEventListener("sa:changed", () => { recalcTotals(); loadDisponibilidadeAll(); }, { passive: true });
    saList.appendChild(row);
    recalcTotals();
  }

  // ===== Modal =====
  Modal.bindBasic(modal, "#modal-cancelar");
  function showModal(open){ modal.style.display = open ? "flex" : "none"; }
  function closeModal(){ showModal(false); }

  Dom.on(Dom.qs("#modal-close"), "click", closeModal);
  Dom.on(btnCancelar, "click", (e)=>{ e.preventDefault(); closeModal(); });
  Dom.on(modal, "click", (e)=>{ if (e.target === modal) closeModal(); });

  function openCreateModal(prefillDate=new Date(), hour=null, minute=0) {
    modalTitle.textContent = "Agendar Serviço";
    fieldId.value = "";
    btnInativar.style.display = "none";

    selCliente.value = "";
    inpData.value = `${prefillDate.getFullYear()}-${pad2(prefillDate.getMonth()+1)}-${pad2(prefillDate.getDate())}`;
    inpHora.value = (hour != null) ? `${pad2(hour)}:${pad2(minute)}` : "08:00";
    selStatus.value = "1";

    clearSaList();
    addSaRow(); // exige pelo menos 1

    showModal(true);
  }

  async function openEditModal(id) {
    try {
      const a = await Api.Agendamentos.get(id);

      modalTitle.textContent = `Editar Agendamento #${a.id}`;
      fieldId.value = a.id;
      btnInativar.style.display = "inline-flex";

      selCliente.value = a?.cliente?.id ? String(a.cliente.id) : "";
      const dt = parseLDT(a.dataHora) || new Date();
      inpData.value = `${dt.getFullYear()}-${pad2(dt.getMonth()+1)}-${pad2(dt.getDate())}`;
      inpHora.value = `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
      selStatus.value = String(a.status ?? 1);

      let itens = Array.isArray(a.servicosAgendados) ? a.servicosAgendados : [];
      if (!itens.length) { try { itens = await Api.ServicosAgendados.list(a.id); } catch {} }

      clearSaList();
      if (itens.length) {
        itens.forEach(sa => {
          addSaRow({
            servicoId: sa?.servico?.id,
            tempo:     sa?.servico?.tempoMedio ?? 30,
            valor:     sa?.servico?.valor ?? 0,
            profId:    sa?.profissional?.id,
            profNome:  sa?.profissional?.nome
          });
        });
      } else {
        addSaRow();
      }

      await loadDisponibilidadeAll();
      recalcTotals();
      showModal(true);
    } catch (e) {
      console.error(e);
      alert("Não foi possível abrir o agendamento.");
    }
  }

  Dom.on(saAdd, "click", () => addSaRow({}));
  Dom.on(inpData, "change", loadDisponibilidadeAll);
  Dom.on(inpHora, "change", loadDisponibilidadeAll);

  Dom.on(btnInativar, "click", async () => {
    const id = Number(fieldId.value || 0);
    if (!id) return;
    if (!confirm(`Inativar Agendamento #${id}?`)) return;
    try {
      await Api.Agendamentos.remove(id);
      closeModal();
      await refreshAndRender();
    } catch (e) {
      console.error(e);
      alert("Falha ao inativar.");
    }
  });

  // ===== Persistência (Agenda -> Itens) =====
  async function salvarAgendaEItens() {
    const id        = Number(fieldId.value || 0);
    const clienteId = Number(selCliente.value || 0);
    const data      = inpData.value;
    const hora      = inpHora.value;
    const status    = Number(selStatus.value || 1);

    const rows = getSaRows();
    if (!clienteId || !data || !hora || rows.length === 0) {
      alert("Preencha Cliente, Data, Hora e adicione ao menos um Serviço.");
      return;
    }

    const itemsRes = ServicosAgendados.collectItems(rows);
    if (!itemsRes.ok) { alert(itemsRes.error); return; }
    const itens = itemsRes.itens;

    const { minutos, valor } = ServicosAgendados.sumTotals(rows);
    hiddenDuracao.value = String(minutos);
    hiddenValor.value   = String(valor.toFixed(2));

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
      if (!agendaId) throw new Error("Falha ao criar Agenda.");
    } else {
      await Api.Agendamentos.update(agendaId, agendaBody);
    }

    const existentes = await Api.ServicosAgendados.list(agendaId).catch(() => []);
    const key = (sa) => `${sa?.servico?.id || sa.servicoId}-${sa?.profissional?.id || sa.profissionalId}`;

    const mapaExist = new Map(existentes.map(sa => [ key(sa), sa ]));
    const mapaNovos = new Map(itens.map(sa => [ key(sa), sa ]));

    for (const [k, novo] of mapaNovos.entries()) {
      const ex = mapaExist.get(k);
      if (!ex) {
        await Api.ServicosAgendados.create(agendaId, novo);
      } else {
        const sId = ex.servico?.id, pId = ex.profissional?.id;
        await Api.ServicosAgendados.update(agendaId, sId, pId, { status: 1 });
      }
    }
    for (const [k, ex] of mapaExist.entries()) {
      if (!mapaNovos.has(k)) {
        const sId = ex.servico?.id, pId = ex.profissional?.id;
        await Api.ServicosAgendados.remove(agendaId, sId, pId);
      }
    }
  }

  Dom.on(form, "submit", async (e) => {
    e.preventDefault();
    try {
      await salvarAgendaEItens();
      closeModal();
      await refreshAndRender();
    } catch (e) {
      console.error(e);
      alert("Falha ao salvar. Veja o console.");
    }
  });

  // ===== Toolbar: estado visual Dia/Semana =====
  function setActiveViewButtons(){
    if (currentView === "day") {
      btnDay.classList.add("active");
      btnWeek.classList.remove("active");
    } else {
      btnWeek.classList.add("active");
      btnDay.classList.remove("active");
    }
  }

  // Handlers corrigidos: todos chamam render()
  Dom.on(btnWeek , "click", () => { currentView="week"; setActiveViewButtons(); render(); });
  Dom.on(btnDay  , "click", () => { currentView="day";  setActiveViewButtons(); render(); });

  Dom.on(btnPrev , "click", () => { currentDate.setDate(currentDate.getDate() + (currentView==="week" ? -7 : -1)); render(); });
  Dom.on(btnNext , "click", () => { currentDate.setDate(currentDate.getDate() + (currentView==="week" ? +7 : +1)); render(); });
  Dom.on(btnToday, "click", () => { currentDate = new Date(); render(); });
  Dom.on(btnAdd  , "click", () => openCreateModal(currentDate) );

  // ===== Coluna de horários =====
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

  // ===== Grade + Overlay (1ª linha clicável e clique sem -30) =====
  function buildGridHeaderAndCells(cols, headers){
    calendarGrid.innerHTML = "";
    calendarGrid.style.position = "relative";

    // Cabeçalho
    const corner = document.createElement("div");
    corner.className = "grid-header-corner";
    calendarGrid.appendChild(corner);

    for (let c=0;c<cols;c++){
      const hd=document.createElement("div");
      hd.className="calendar-day-header";
      hd.innerHTML=headers[c];
      calendarGrid.appendChild(hd);
    }

    // Linhas da grade
    const totalRows=(END_HOUR-START_HOUR)*(60/SLOT_MIN); // 22
    const headerHeightPx = (calendarGrid.querySelector(".calendar-day-header")?.offsetHeight
                           || calendarGrid.querySelector(".grid-header-corner")?.offsetHeight
                           || 50);

    calendarGrid.style.gridTemplateRows = `${headerHeightPx}px repeat(${totalRows}, var(--slot-height, 50px))`;
    timeColumn.style.paddingTop = `${headerHeightPx}px`;

    // Células clicáveis
    calendarGrid.style.gridTemplateColumns=`auto repeat(${cols},1fr)`;
    for (let r=0;r<totalRows;r++){
      const ph=document.createElement("div");
      ph.className="calendar-grid-cell";
      ph.style.background="transparent";
      ph.style.borderRight="1px solid var(--color-border-default)";
      calendarGrid.appendChild(ph);

      for (let c=0;c<cols;c++){
        const cell=document.createElement("div");
        cell.className="calendar-grid-cell";
        cell.dataset.row=r; cell.dataset.col=c;

        cell.addEventListener("click",()=> {
          const minuteIndex = r * SLOT_MIN;
          const hour  = Math.floor(minuteIndex/60) + START_HOUR;
          const min   = minuteIndex % 60;
          openCreateModal(new Date(currentDate), hour, min);
        });

        calendarGrid.appendChild(cell);
      }
    }

    // Overlay para os cards
    const overlay = document.createElement("div");
    overlay.className = "calendar-overlay";
    overlay.style.position = "absolute";
    overlay.style.left = "0";
    overlay.style.right = "0";
    overlay.style.top = `${headerHeightPx}px`;
    overlay.style.bottom = "0";
    overlay.style.display = "grid";
    overlay.style.gridTemplateColumns = `auto repeat(${cols}, 1fr)`;
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "2";

    overlay.appendChild(document.createElement("div")); // coluna do tempo

    DAY_OVERLAYS = [];
    for (let c=0;c<cols;c++){
      const dayCol = document.createElement("div");
      dayCol.style.position = "relative";
      dayCol.style.height = "100%";
      dayCol.style.pointerEvents = "none";
      overlay.appendChild(dayCol);
      DAY_OVERLAYS.push(dayCol);
    }
    calendarGrid.appendChild(overlay);
  }

  function getWeekDays(){
    const start = startOfWeek(currentDate);
    return Array.from({length:7},(_,i)=>{const d=new Date(start); d.setDate(start.getDate()+i); return d;});
  }

  // ===== Layout de colisões =====
  function layoutOverlaps(dayEvents) {
    dayEvents.sort((a,b)=> (a.startMin - b.startMin) || (a.endMin - b.endMin));
    let active = [], clusterId = -1, clusterMaxCols = {}, result = [];
    for (const e of dayEvents) {
      active = active.filter(x => x.endMin > e.startMin);
      if (active.length === 0) clusterId++;
      const used = new Set(active.map(x => x._col));
      let col = 0; while (used.has(col)) col++;
      e._col = col; e._cluster = clusterId; active.push(e);
      const maxCols = Math.max(...active.map(x => x._col + 1));
      clusterMaxCols[clusterId] = Math.max(clusterMaxCols[clusterId] || 0, maxCols);
      result.push(e);
    }
    result.forEach(e => e._colsInCluster = clusterMaxCols[e._cluster] || 1);
    return result;
  }

  function renderCards(daysOrDay) {
    const isWeek = Array.isArray(daysOrDay);
    const cols = isWeek ? daysOrDay.length : 1;

    DAY_OVERLAYS.forEach(col => col.innerHTML = "");

    const eventsByCol = Array.from({ length: cols }, () => []);
    (AGENDAS || []).forEach(a => {
      const start = parseLDT(a.dataHora); if(!start) return;

      let dayIndex = 0;
      if (isWeek) {
        dayIndex = daysOrDay.findIndex(d=>isSameDay(d,start));
        if (dayIndex === -1) return;
      } else {
        if (!isSameDay(start, daysOrDay)) return;
        dayIndex = 0;
      }

      const fromMidnight = minutesFromStartOfDay(start);
      const startMin = Math.max(0, fromMidnight - START_HOUR * 60);
      const durMin   = Math.max(0, Number(a.tempoTotal || 0));
      const endMin   = Math.min(DAY_TOTAL_MINUTES, startMin + durMin);
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
        const topPct    = (ev.startMin / DAY_TOTAL_MINUTES) * 100;
        const heightPct = Math.max( (ev.durMin / DAY_TOTAL_MINUTES) * 100, 2 );

        const widthPct = 100 / Math.max(1, ev._colsInCluster);
        const leftPct  = widthPct * ev._col;

        const start = ev.startDate;
        const end   = addMinutes(start, a.tempoTotal || 0);

        const clienteNome = a?.cliente?.nome ?? "—";
        const servicosTxt = (a.servicosAgendados||[]).map(sa=>sa?.servico?.descricao).filter(Boolean).join(", ");
        const prof        = (a.servicosAgendados||[]).map(sa=>sa?.profissional?.nome).filter(Boolean)[0] ?? "—";

        const card=document.createElement("div");
        card.className="appointment-card";
        card.style.position="absolute";
        card.style.top=`${topPct}%`;
        card.style.height=`${heightPct}%`;
        card.style.width = `calc(${widthPct}% - ${COL_GAP_PX}px)`;
        card.style.left  = `calc(${leftPct}% + ${COL_GAP_PX/2}px)`;
        card.style.pointerEvents = "auto";
        card.style.zIndex = "3";

        if (Number(a.status) === 2) card.classList.add("cancelled");

        card.innerHTML=`
          <div class="appt-time">${pad2(start.getHours())}:${pad2(start.getMinutes())} - ${pad2(end.getHours())}:${pad2(end.getMinutes())}</div>
          <div class="appt-title">${prof}</div>
          <div class="appt-details">${clienteNome}${servicosTxt ? " • "+servicosTxt : ""}</div>
          <div class="appt-status">${Number(a.status)===2? "Inativo":"Ativo"}</div>
        `;
        card.addEventListener("click",(e)=>{ e.stopPropagation(); openEditModal(a.id); });
        overlay.appendChild(card);
      });
    });
  }

  // ===== Render principal =====
  function renderInternal(){
    renderTimeColumn();
    if (currentView==="week"){
      const days = getWeekDays();
      periodLabel.textContent = formatPeriodWeek(days[0]);
      const headers = days.map(d=>`<span class="day-name">${d.toLocaleDateString("pt-BR",{weekday:"short"})}</span><span class="day-date">${pad2(d.getDate())}</span>`);
      buildGridHeaderAndCells(7, headers);
      renderCards(days);
    } else {
      const d = new Date(currentDate); d.setHours(0,0,0,0);
      periodLabel.textContent = d.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
      buildGridHeaderAndCells(1, [ `<span class="day-name">${d.toLocaleDateString("pt-BR",{weekday:"short"})}</span>` ]);
      renderCards(d);
    }
  }

  // Alias claro para re-render (usado pelos botões)
  function render(){ setActiveViewButtons(); renderInternal(); }

  async function refreshAndRender(){ AGENDAS = await Api.Agendamentos.list(); render(); }

  // boot
  (async function init(){ await refreshAndRender(); })();
});
