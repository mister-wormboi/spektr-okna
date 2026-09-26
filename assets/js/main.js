const ASSETS = {
  white: 'assets/window-white.png',
  black: 'assets/window-black.png',
  hero: 'assets/hero.png',
};

const products = {
  'Окна': [
    {
      title: 'Окно «Комфорт»',
      profile: 'ПВХ',
      image: ASSETS.white,
      price: 18900,
      energy: true,
      sashes: [1, 2],
      size: 'До 120 см',
    },
    {
      title: 'Окно «Панорама»',
      profile: 'Алюминий',
      image: ASSETS.black,
      price: 28600,
      energy: false,
      sashes: [2, 3],
      size: 'От 120 см',
    },
  ],

  'Двери': [
    {
      title: 'Балконная дверь',
      profile: 'ПВХ',
      image: ASSETS.white,
      price: 21600,
      energy: true,
      sashes: [1, 2, 3],
      size: 'Любой размер',
    },
    {
      title: 'Алюминиевая дверь',
      profile: 'Алюминий',
      image: ASSETS.black,
      price: 34200,
      energy: false,
      sashes: [1, 2, 3],
      size: 'Любой размер',
    },
  ],

  'Остекление балконов': [
    {
      title: 'Остекление лоджии',
      profile: 'ПВХ',
      image: ASSETS.white,
      price: 38500,
      energy: true,
      sashes: [1, 2, 3],
      size: 'Любой размер',
    },
    {
      title: 'Панорамное остекление',
      profile: 'Алюминий',
      image: ASSETS.black,
      price: 52900,
      energy: false,
      sashes: [1, 2, 3],
      size: 'Любой размер',
    },
  ],

  'Рулонные шторы': [
    {
      title: 'Рулонные шторы «Стандарт»',
      profile: 'Текстиль',
      image: ASSETS.white,
      price: 4900,
      energy: false,
      sashes: [1, 2, 3],
      size: 'Любой размер',
    },
    {
      title: 'Рулонные шторы для панорамных окон',
      profile: 'Текстиль',
      image: ASSETS.black,
      price: 9900,
      energy: false,
      sashes: [1, 2, 3],
      size: 'Любой размер',
    },
  ],

  'Рольставни': [
    {
      title: 'Рольставни «Защита»',
      profile: 'Алюминий',
      image: ASSETS.black,
      price: 18400,
      energy: false,
      sashes: [1, 2, 3],
      size: 'Любой размер',
    },
    {
      title: 'Рольставни с автоматикой',
      profile: 'Алюминий',
      image: ASSETS.hero,
      price: 32900,
      energy: true,
      sashes: [1, 2, 3],
      size: 'Любой размер',
    },
  ],

  'Алюм. конструкции': [
    {
      title: 'Раздвижная система',
      profile: 'Алюминий',
      image: ASSETS.black,
      price: 62400,
      energy: false,
      sashes: [1, 2, 3],
      size: 'Любой размер',
    },
    {
      title: 'Панорамный портал',
      profile: 'Алюминий',
      image: ASSETS.hero,
      price: 89900,
      energy: true,
      sashes: [1, 2, 3],
      size: 'Любой размер',
    },
  ],

  'Шторы': [
    {
      title: 'Рулонные шторы',
      profile: 'Текстиль',
      image: ASSETS.white,
      price: 4900,
      energy: false,
      sashes: [1, 2, 3],
      size: 'Любой размер',
    },
    {
      title: 'Шторы для панорамных окон',
      profile: 'Текстиль',
      image: ASSETS.black,
      price: 9900,
      energy: false,
      sashes: [1, 2, 3],
      size: 'Любой размер',
    },
  ],
};

const elements = {
  width: document.querySelector('#widthInput'),
  height: document.querySelector('#heightInput'),
  sashes: document.querySelector('#sashesInput'),
  profile: document.querySelector('#profileInput'),
  price: document.querySelector('#calcPrice'),
  window: document.querySelector('.window-illustration'),
  cards: document.querySelector('#cards'),
  tabs: document.querySelectorAll('.tab'),
  filters: document.querySelector('.filters'),
  profileFilter: document.querySelector('#profileFilter'),
  sizeFilter: document.querySelector('#sizeFilter'),
  energyFilter: document.querySelector('#extraFilter'),
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


function selectedSashCount() {
  const selected = document.querySelector(
    'input[name="sashesFilter"]:checked'
  );

  return Number(selected ? selected.value : 2);
}

let currentCategory = 'Окна';

function matchesFilters(product, query) {
  const profile = elements.profileFilter.value;
  const size = elements.sizeFilter.value;

  const searchable = (
    product.title +
    ' ' +
    product.profile +
    ' ' +
    currentCategory
  ).toLowerCase();

  return (
    (
      profile === 'Любой профиль' ||
      product.profile === profile
    ) &&
    (
      size === 'Любой размер' ||
      product.size === 'Любой размер' ||
      product.size === size
    ) &&
    (
      !elements.energyFilter.checked ||
      product.energy
    ) &&
    product.sashes.includes(
      selectedSashCount()
    ) &&
    (
      !query ||
      searchable.includes(query)
    )
  );
}

function productCard(product) {
  return (
    '<article class="card card-enter">' +

    '<img ' +
    'src="' + product.image + '" ' +
    'alt="' + product.title + '" ' +
    'loading="lazy">' +

    '<div class="card-body">' +

    '<small>' +
    currentCategory +
    ' · ' +
    product.profile +
    '</small>' +

    '<h3>' +
    product.title +
    '</h3>' +

    '<p>' +
    'Надёжная конструкция, точное изготовление ' +
    'и профессиональный монтаж.' +
    '</p>' +

    '<div class="card-bottom">' +

    '<span>' +
    'Стоимость от' +
    '<b>' +
    formatPrice(product.price) +
    ' ₽' +
    '</b>' +
    '</span>' +

    '<a href="tel:+79895175699">' +
    'Уточнить стоимость ↗' +
    '</a>' +

    '</div>' +

    '</div>' +

    '</article>'
  );
}

function renderProducts() {
  const query = elements.searchInput.value
    .trim()
    .toLowerCase();

  const visible = products[currentCategory].filter(
    (product) => matchesFilters(product, query)
  );

  elements.cards.innerHTML = visible.length
    ? visible.map(productCard).join('')
    : (
      '<div class="empty">' +
      'По выбранным параметрам вариантов нет.' +
      '</div>'
    );

  elements.searchStatus.textContent = query
    ? 'Найдено вариантов: ' + visible.length
    : '';

  elements.searchStatus.style.display = query
    ? 'block'
    : 'none';
}


function changeCategory(selectedTab) {
  currentCategory =
    selectedTab.dataset.category;

  elements.tabs.forEach((tab) => {
    tab.classList.toggle(
      'is-active',
      tab === selectedTab
    );
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

elements.filters.addEventListener(
  'change',
  renderProducts
);

elements.searchInput.addEventListener(
  'input',
  renderProducts
);

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