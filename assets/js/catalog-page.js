(() => {
  const allCatalogItems = window.SPEKTR_CATALOG || [];
  const catalogGrid = document.querySelector('#fullCatalogCards');
  const categoryButtons = [...document.querySelectorAll('.catalog-filter')];
  const sortSelect = document.querySelector('#catalogSort');
  const catalogCount = document.querySelector('#catalogCount');
  if (!catalogGrid || !sortSelect || !catalogCount) return;
  let selectedGroup = 'all';

  function renderFullCatalog() {
    const visibleItems = window.selectCatalogItems(allCatalogItems, { group: selectedGroup, sort: sortSelect.value });

    catalogGrid.replaceChildren(...visibleItems.map((item, index) => window.renderSpektrCatalogCard(item, index, '../')));
    catalogCount.textContent = `Показано: ${visibleItems.length} из ${allCatalogItems.length}`;
  }

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedGroup = button.dataset.group;
      categoryButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      renderFullCatalog();
    });
  });

  sortSelect.addEventListener('change', renderFullCatalog);
  renderFullCatalog();
})();
