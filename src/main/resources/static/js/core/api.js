(function (global) {
  const { Http } = global.App;

  const wrap = (fn) => async (...a) => (await fn(...a)).data;

  const jsonPost = (body) => ({
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  });

  const jsonPut = (body) => ({
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  });

  const jsonPatch = (body) => ({
    method: "PATCH",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" }
  });

  const Auth = {
    login:    wrap((body) => Http.request(`/auth/login`, jsonPost(body))),
    me:       wrap(() => Http.request(`/auth/me`)),
    logout:   wrap(() => Http.request(`/auth/logout`, { method: "POST" }))
  };

  const Clientes = {
    list: wrap((query = '') => Http.request(`/clientes${query}`)),
    get: wrap((id) => Http.request(`/clientes/${id}`)),
    create: wrap((body) => Http.request(`/clientes`, jsonPost(body))),
    update: wrap((id, body) => Http.request(`/clientes/${id}`, jsonPut(body))),
    remove: wrap((id) => Http.request(`/clientes/${id}`, { method: "DELETE" })),
    reativar: wrap((id) => Http.request(`/clientes/${id}/reativar`, { method: "PATCH" }))
  };

  const Profissionais = {
    list: wrap((query = '') => Http.request(`/profissionais${query}`)),
    get: wrap((id) => Http.request(`/profissionais/${id}`)),
    create: wrap((body) => Http.request(`/profissionais`, jsonPost(body))),
    update: wrap((id, body) => Http.request(`/profissionais/${id}`, jsonPut(body))),
    remove: wrap((id) => Http.request(`/profissionais/${id}`, { method: "DELETE" })),
    reativar: wrap((id) => Http.request(`/profissionais/${id}/reativar`, { method: "PATCH" }))
  };

  const Servicos = {
    list: wrap((query = "") => Http.request(`/servicos${query}`)),
    get: wrap((id) => Http.request(`/servicos/${id}`)),
    create: wrap((body) => Http.request(`/servicos`, jsonPost(body))),
    update: wrap((id, body) => Http.request(`/servicos/${id}`, jsonPut(body))),
    remove: wrap((id) => Http.request(`/servicos/${id}`, { method: "DELETE" })),
    reativar: wrap((id) => Http.request(`/servicos/${id}/reativar`, { method: "PATCH" }))
  };

  const Catalogo = {
    list: wrap((query = "") => Http.request(`/catalogos${query}`)),
    get: wrap((profId, servId) => Http.request(`/catalogos/${profId}/${servId}`)),
    create: wrap((body) => Http.request(`/catalogos`, jsonPost(body))),
    update: wrap((profId, servId, body) => Http.request(`/catalogos/${profId}/${servId}`, jsonPut(body))),
    remove: wrap((profId, servId) => Http.request(`/catalogos/${profId}/${servId}`, { method: "DELETE" })),
    reativar: wrap((profId, servId) => Http.request(`/catalogos/${profId}/${servId}/reativar`, { method: "PATCH" }))
  };

  const Agendamentos = {
    list: wrap((query = "") => Http.request(`/agendamentos${query}`)),
    get: wrap((id) => Http.request(`/agendamentos/${id}`)),
    create: wrap((body) => Http.request(`/agendamentos`, jsonPost(body))),
    update: wrap((id, body) => Http.request(`/agendamentos/${id}`, jsonPut(body))),
    remove: wrap((id) => Http.request(`/agendamentos/${id}`, { method: "DELETE" })),
    reativar: wrap((id) => Http.request(`/agendamentos/${id}/reativar`, { method: "PATCH" })),
    concluir: wrap((id) => Http.request(`/agendamentos/${id}/concluir`, { method: "PATCH" })),

    profDisp: wrap((inicioISOWithOffset, duracaoMin, servicoId) => {
      const qs = new URLSearchParams();
      if (inicioISOWithOffset) qs.set("inicio", inicioISOWithOffset);
      if (duracaoMin != null) qs.set("duracaoMin", String(duracaoMin));
      if (servicoId != null) qs.set("servicoId", String(servicoId));
      const path = `/agendamentos/profissionais-disponiveis${qs.toString() ? `?${qs}` : ""}`;
      return Http.request(path, { method: "GET" });
    })
  };

  const ServicosAgendados = {
    list: wrap((agendaId, query = "") => Http.request(`/agendamentos/${agendaId}/servicosAgendados${query}`)),
    get: wrap((agendaId, servId, profId) => Http.request(`/agendamentos/${agendaId}/servicosAgendados/${servId}/${profId}`)),
    create: wrap((agendaId, body) => Http.request(`/agendamentos/${agendaId}/servicosAgendados`, jsonPost(body))),
    update: wrap((agendaId, servId, profId, body) => Http.request(`/agendamentos/${agendaId}/servicosAgendados/${servId}/${profId}`, jsonPut(body))),
    remove: wrap((agendaId, servId, profId) => Http.request(`/agendamentos/${agendaId}/servicosAgendados/${servId}/${profId}`, { method: "DELETE" })),
    reativar: wrap((agendaId, servId, profId) => Http.request(`/agendamentos/${agendaId}/servicosAgendados/${servId}/${profId}/reativar`, { method: "PATCH" })),
  };

  global.App.Api = { Auth, Clientes, Profissionais, Servicos, Catalogo, Agendamentos, ServicosAgendados };
})(window);
