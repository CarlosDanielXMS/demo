document.addEventListener('DOMContentLoaded', () => {
  const { Dom } = window.App;

  const maps = [
    { input: '#search-cliente', table: 'table.data-table' },
    { input: '#search-profissional', table: 'table.data-table' },
    { input: '#search-servico', table: 'table.data-table' },
    { input: '#search-catalogo', table: '#catalogo-table' }
  ];

  maps.forEach(({ input, table }) => {
    const el = Dom.qs(input);
    if (!el) return;
    Dom.on(el, 'input', () => Dom.filterTableByQuery(table, el.value || ''));
  });
});
