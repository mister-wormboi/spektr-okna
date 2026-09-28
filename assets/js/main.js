// Prices supplied by the customer, 28 September 2026.
const products = [
  {
    "title": "Ремонт фурнитуры на оконной створке",
    "category": "Ремонт и обслуживание",
    "profile": "ПВХ",
    "price": 3500,
    "unit": "",
    "image": "assets/catalog/hardware.jpg"
  },
  {
    "title": "Замена резины притвора",
    "category": "Ремонт и обслуживание",
    "profile": "ПВХ",
    "price": 700,
    "unit": "",
    "image": "assets/catalog/seal.jpg"
  },
  {
    "title": "Замена глухой створки на поворотно-откидную",
    "category": "Ремонт и обслуживание",
    "profile": "ПВХ",
    "price": 4500,
    "unit": "",
    "image": "assets/catalog/sash-conversion.jpg"
  },
  {
    "title": "Замена стеклопакета",
    "category": "Ремонт и обслуживание",
    "profile": "ПВХ",
    "price": 2500,
    "unit": "",
    "image": "assets/catalog/glass-replacement.jpg"
  },
  {
    "title": "Ремонт фурнитуры на балконной двери",
    "category": "Ремонт и обслуживание",
    "profile": "ПВХ",
    "price": 5000,
    "unit": "",
    "image": "assets/catalog/door-hardware.jpg"
  },
  {
    "title": "Окно-фрамуга",
    "category": "Окна и двери",
    "profile": "ПВХ",
    "price": 2000,
    "unit": "",
    "image": "assets/catalog/transom.jpg"
  },
  {
    "title": "Окно поворотно-откидное",
    "category": "Окна и двери",
    "profile": "ПВХ",
    "price": 4000,
    "unit": "",
    "image": "assets/catalog/tilt-window.jpg"
  },
  {
    "title": "Регулировка створки",
    "category": "Ремонт и обслуживание",
    "profile": "ПВХ",
    "price": 800,
    "unit": "",
    "image": "assets/catalog/adjustment.jpg"
  },
  {
    "title": "Москитная сетка «Антимошка»",
    "category": "Москитные сетки",
    "profile": "ПВХ",
    "price": 2500,
    "unit": "",
    "image": "assets/catalog/mesh-midge.jpg"
  },
  {
    "title": "Москитная сетка «Антикошка»",
    "category": "Москитные сетки",
    "profile": "ПВХ",
    "price": 3000,
    "unit": "",
    "image": "assets/catalog/mesh-cat.jpg"
  },
  {
    "title": "Москитная сетка стандартная",
    "category": "Москитные сетки",
    "profile": "ПВХ",
    "price": 1000,
    "unit": "",
    "image": "assets/catalog/mesh-standard.jpg"
  },
  {
    "title": "Балконная дверь металлопластиковая",
    "category": "Окна и двери",
    "profile": "ПВХ",
    "price": 12000,
    "unit": "",
    "image": "assets/catalog/balcony-door.jpg"
  },
  {
    "title": "Входная дверь металлопластиковая",
    "category": "Окна и двери",
    "profile": "ПВХ",
    "price": 18000,
    "unit": "",
    "image": "assets/catalog/entrance-door.jpg"
  },
  {
    "title": "Балконный блок с окном",
    "category": "Окна и двери",
    "profile": "ПВХ",
    "price": 14000,
    "unit": "",
    "image": "assets/catalog/balcony-block.jpg"
  },
  {
    "title": "Угловой наличник 90×60×10 / 60×90×10",
    "category": "Отделка",
    "profile": "ПВХ",
    "price": 1000,
    "unit": "",
    "image": "assets/catalog/trim.jpg"
  },
  {
    "title": "Натяжной потолок",
    "category": "Отделка",
    "profile": "",
    "price": 650,
    "unit": "м²",
    "image": "assets/catalog/ceiling.jpg"
  },
  {
    "title": "Жалюзи вертикальные",
    "category": "Жалюзи и шторы",
    "profile": "Жалюзи",
    "price": 1700,
    "unit": "",
    "image": "assets/catalog/vertical-blinds.jpg"
  },
  {
    "title": "Рулонные шторы ЮНИ-1 (с направляющими)",
    "category": "Жалюзи и шторы",
    "profile": "Жалюзи",
    "price": 2500,
    "unit": "",
    "image": "assets/catalog/uni-blind.jpg"
  },
  {
    "title": "Рулонные шторы МИНИ (свободно висящие)",
    "category": "Жалюзи и шторы",
    "profile": "Жалюзи",
    "price": 2000,
    "unit": "",
    "image": "assets/catalog/mini-blind.jpg"
  }
];

const elements = {
  width: document.querySelector('#widthInput'),
  height: document.querySelector('#heightInput'),
  sashes: document.querySelector('#sashesInput'),
  profile: document.querySelector('#profileInput'),
  price: document.querySelector('#calcPrice'),
  window: document.querySelector('.window-illustration'),
  cards: document.querySelector('#cards'),
  tabs: document.querySelectorAll('.tab'),
  sort: document.querySelector('#catalogSort'),
  catalogSearch: document.querySelector('#catalogSearch'),
  searchForm: document.querySelector('#searchForm'),
  searchInput: document.querySelector('#searchInput'),
  searchStatus: document.querySelector('#searchStatus'),
};

const formatPrice = (value) => {
  return new Intl.NumberFormat('ru-RU').format(
    Math.round(value)
  );
};


function updateCalculator() {
  const width = Math.max(
    40,
    Number(elements.width.value) || 120
  );

  const height = Math.max(
    40,
    Number(elements.height.value) || 140
  );

  const sashCount = Number(elements.sashes.value);
  const multiplier = Number(elements.profile.value);

  const areaPrice =
    ((width * height) / 10000) * 8600;

  const price = Math.max(
    8900,
    (areaPrice + 2900) * multiplier +
    (sashCount - 1) * 1300
  );

  elements.price.textContent =
    'от ' + formatPrice(price) + ' ₽';

  elements.window.style.width =
    Math.min(170, 100 + width / 3) + 'px';
}


let currentCategory = 'Все';
const icons = {
  'Окна и двери': '<rect x="9" y="5" width="30" height="38" rx="1"/><path d="M24 5v38M12 8h9v32h-9zM27 8h9v32h-9zM29 22v5"/>',
  'Ремонт и обслуживание': '<path d="M29 7a11 11 0 0 0-13 14L6 31a6 6 0 0 0 9 9l11-11A11 11 0 0 0 40 15l-8 8-7-7z"/>',
  'Москитные сетки': '<rect x="9" y="5" width="30" height="38" rx="1"/><path d="M15 5v38M21 5v38M27 5v38M33 5v38M9 13h30M9 21h30M9 29h30M9 37h30"/>',
  'Жалюзи и шторы': '<path d="M7 7h34v6H7zM10 13v26h28V13M10 20h28M10 27h28M10 34h28M42 13v22"/><circle cx="42" cy="37" r="2"/>',
  'Отделка': '<path d="M6 35V10h36v25M6 10l9 9h18l9-9M15 19v23M33 19v23M15 19h18"/>'
};
function productCard(product, index) {
  return '<article class="card card-enter" style="--card-delay:' + Math.min(index, 5) * 35 + 'ms">' +
    (product.image ? '<div class="catalog-photo"><img src="' + product.image + '" alt="' + product.title + '" width="1536" height="1024" loading="lazy" decoding="async"></div>' : '<div class="catalog-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">' + icons[product.category] + '</svg></div>') +
    '<div class="card-body"><small>' + product.category + (product.profile ? ' · ' + product.profile : '') + '</small>' +
    '<h3>' + product.title + '</h3><div class="card-bottom"><span>от <b>' + formatPrice(product.price) + ' ₽' + (product.unit ? ' / ' + product.unit : '') + '</b></span>' +
    '<a href="tel:+79895175699" aria-label="Уточнить стоимость: ' + product.title + '">Уточнить цену ↗</a></div></div></article>';
}
function renderProducts() {
  const query = elements.catalogSearch.value.trim().toLocaleLowerCase('ru');
  const visible = products.filter(product =>
    (currentCategory === 'Все' || product.category === currentCategory) &&
    (!query || (product.title + ' ' + product.category + ' ' + product.profile).toLocaleLowerCase('ru').includes(query))
  );
  if (elements.sort.value !== 'default') visible.sort((a,b) => elements.sort.value === 'asc' ? a.price-b.price : b.price-a.price);
  elements.cards.innerHTML = visible.length ? visible.map(productCard).join('') : '<div class="empty">Ничего не найдено. Попробуйте другую категорию или название.<button type="button" id="resetCatalog">Сбросить поиск</button></div>';
  document.querySelector('#resetCatalog')?.addEventListener('click', () => {
    elements.catalogSearch.value = elements.searchInput.value = '';
    changeCategory(elements.tabs[0]);
    elements.catalogSearch.focus();
  });
  elements.searchStatus.textContent = query ? 'Найдено: ' + visible.length : '';
  elements.searchStatus.style.display = query ? 'block' : 'none';
}
function changeCategory(selectedTab) {
  currentCategory = selectedTab.dataset.category;
  elements.tabs.forEach(tab => {
    tab.classList.toggle('is-active', tab === selectedTab);
    tab.setAttribute('aria-pressed', String(tab === selectedTab));
  });
  renderProducts();
}

document
  .querySelectorAll(
    '.calculator input, .calculator select'
  )
  .forEach((control) => {
    control.addEventListener(
      'input',
      updateCalculator
    );
  });


elements.tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    changeCategory(tab);
  });
});

elements.sort.addEventListener('change', renderProducts);
elements.catalogSearch.addEventListener('input', () => { elements.searchInput.value = elements.catalogSearch.value; renderProducts(); });

elements.searchInput.addEventListener('input', () => { elements.catalogSearch.value = elements.searchInput.value; changeCategory(elements.tabs[0]); });

elements.searchForm.addEventListener(
  'submit',
  (event) => {
    event.preventDefault();

    document
      .querySelector('#catalog')
      .scrollIntoView({
        behavior: 'smooth',
      });
  }
);

updateCalculator();
renderProducts();

const reduceMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

const revealGroups = [
  [
    '.call-panel',
    'reveal-left',
  ],

  [
    '.calculator',
    'reveal-right',
  ],

  [
    '.section-heading, ' +
    '.tabs, ' +
    '.filters, ' +
    '.reviews-heading, ' +
    '.reviews-bottom, ' +
    '.guides > .wrap > .eyebrow, ' +
    '.guides h2, ' +
    '.home-offices-heading, ' +
    '.home-offices-link',
    '',
  ],

  [
    '.review-card, ' +
    '.guides details, ' +
    '.home-office-card',
    '',
  ],

  [
    '.contact-copy',
    'reveal-left',
  ],

  [
    '.contact-map',
    'reveal-right',
  ],
];

const revealItems = [];

revealGroups.forEach(
  ([selector, direction]) => {
    document
      .querySelectorAll(selector)
      .forEach((element, index) => {
        element.classList.add('reveal');

        if (direction) {
          element.classList.add(direction);
        }

        element.style.transitionDelay =
          Math.min(index * 70, 210) + 'ms';

        revealItems.push(element);
      });
  }
);


if (
  reduceMotion ||
  !('IntersectionObserver' in window)
) {
  revealItems.forEach((element) => {
    element.classList.add('is-visible');
  });
} else {
  const revealObserver =
    new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add(
            'is-visible'
          );

          observer.unobserve(
            entry.target
          );
        });
      },
      {
        threshold: 0.14,
        rootMargin: '0px 0px -40px',
      }
    );

  revealItems.forEach((element) => {
    revealObserver.observe(element);
  });
}
