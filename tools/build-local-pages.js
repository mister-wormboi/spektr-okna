// Real office pages and two service pages, with useful content in the initial HTML.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const branches = require('../content/branches.json');
const shell = fs.readFileSync(path.join(root, 'templates/articles-shell.tpl'), 'utf8')
  .replace(/  <link[^\n]+assets\/css\/articles\.css[^\n]+\n/, '')
  .replace('class="articles-page {{body_class}}"', 'class="local-page"')
  .replace('class="articles-skip"', 'class="local-skip"');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
function write(route, title, description, content) {
  const prefix = '../'.repeat(route.split('/').filter(Boolean).length);
  const values = { prefix, title: escape(title), description: escape(description), head_extra: '', og_type: 'website', body_class: '', detail_css: `<link rel="stylesheet" href="${prefix}assets/css/local-pages.css?v=20261104">`, structured_data: '', nav_current: '', articles_href: prefix + 'articles/', main: content };
  const html = shell.replace(/\{\{([a-z_]+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Unknown template value: ${key}`);
    return values[key];
  }).replace(' aria-current=""', '');
  const directory = path.join(root, route);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), html);
}
const cities = {
  'rostov-na-donu': { where: 'в Ростове-на-Дону', title: 'Ростов-на-Дону', intro: 'Два салона в Ростове-на-Дону: на проспекте 40-летия Победы и на улице Зорге. Выберите удобный офис, чтобы посмотреть образцы и обсудить замену окон.', note: 'На Александровке удобен офис на проспекте 40-летия Победы, 89. На Западном — на Зорге, 48. У второго офиса есть обеденный перерыв: проверьте часы работы перед поездкой.' },
  azov: { where: 'в Азове', title: 'Азов', intro: 'Офис «Спектр» в Азове находится на улице Ленина, 66. Здесь можно обсудить окна для квартиры, балконный блок или остекление частного дома.', note: 'Азовский офис работает с 08:00 и принимает посетителей по субботам и воскресеньям до 14:00. Для предварительного обсуждения заказа доступны два телефона.' },
  bataysk: { where: 'в Батайске', title: 'Батайск', intro: 'Салон «Спектр» в Батайске расположен по адресу: улица М. Горького, 152 / улица Куйбышева, 143. Приходите с фото проёма и пожеланиями к новым окнам.', note: 'В карточке указан адрес здания с двух улиц — М. Горького и Куйбышева. Офис открыт по будням и в субботу; воскресенье — выходной.' },
  eysk: { where: 'в Ейске', title: 'Ейск', intro: 'Выбрать пластиковые окна в Ейске можно в салоне «Спектр» на улице Карла Либкнехта, 70. Специалист поможет сопоставить профиль, стеклопакет и схему открывания.', note: 'Ейский офис представляет «Спектр» в Краснодарском крае. По будням предусмотрен перерыв с 13:00 до 14:00, в субботу салон работает до 14:00.' },
  kuleshovka: { where: 'в Кулешовке', title: 'Кулешовка', intro: 'Офис «Спектр» в Кулешовке находится на улице Матросова, 11. Обсудите здесь окна ПВХ для дома, квартиры или замену балконного блока.', note: 'Офис открывается в 08:00. По будням есть перерыв с 12:00 до 13:00; в субботу можно обратиться до 13:00. Воскресенье — выходной.' }
};
function office(branch, prefix) {
  const map = `https://yandex.ru/maps/?text=${encodeURIComponent(branch.city + ', ' + branch.street)}`;
  return `<article class="local-office" id="${branch.id}"><a href="${map}" target="_blank" rel="noopener noreferrer"><img src="${prefix}${branch.mapImage}" width="1260" height="810" loading="lazy" decoding="async" alt="Карта: ${escape(branch.city + ', ' + branch.street)}"></a><div><h3>${escape(branch.street)}</h3><p>${escape(branch.city)} · ${branch.region}</p><p>${branch.hours}</p><div class="local-actions">${branch.phones.map(phone => `<a class="local-button" href="tel:${phone.number}">${phone.display}</a>`).join('')}<a class="local-text-link" href="${map}" target="_blank" rel="noopener noreferrer">Открыть карту ↗</a></div></div></article>`;
}
function links(prefix) {
  return `<nav class="local-related" aria-label="Выбор и заказ окон"><a href="${prefix}catalog/okna/">Окна ПВХ и оконные системы ↗</a><a href="${prefix}ustanovka-okon/">Установка окон ↗</a><a href="${prefix}calculator/">Калькулятор стоимости ↗</a><a href="${prefix}solutions/">Примеры работ ↗</a></nav>`;
}
for (const [slug, city] of Object.entries(cities)) {
  const offices = branches.filter(b => b.slug === slug);
  const prefix = '../../';
  const content = `<main id="content" class="wrap local-main">
    <nav class="breadcrumbs" aria-label="Хлебные крошки"><a href="../../">Главная</a><span aria-hidden="true">/</span><a href="../">Филиалы</a><span aria-hidden="true">/</span><span aria-current="page">${city.title}</span></nav>
    <header class="local-heading"><h1>Пластиковые окна<br><em class="heading-accent">${city.where}.</em></h1><p>${city.intro}</p><div class="local-actions"><a class="local-button" href="../../#request">Оставить заявку</a><a class="local-text-link" href="#offices">Адреса и телефоны ↗</a></div></header>
    <section id="offices" class="local-section"><h2>Где купить окна ${city.where}?</h2><p class="local-lead">${city.note}</p><div class="local-offices">${offices.map(b => office(b, prefix)).join('')}</div></section>
    <section class="local-section"><h2>От выбора окна — к установке.</h2><div class="local-grid"><div><h3>Что можно заказать</h3><p>Пластиковые окна ПВХ из профилей REHAU и PRO WINS, балконные блоки и остекление по индивидуальным размерам. Комплектацию подбираем под помещение, шум с улицы и нужное открывание.</p><a href="../../catalog/okna/">Посмотреть оконные системы ↗</a></div><div><h3>Как получить цену с установкой</h3><p>Пришлите фото и примерные размеры, укажите адрес объекта. После замера согласуем изделие, монтаж и дополнительные работы. Уточните, нужны ли демонтаж, подоконник, отлив, сетка и откосы.</p><a href="../../ustanovka-okon/">Как проходит установка ↗</a></div></div></section>
    <section class="local-section"><h2>Сколько стоят пластиковые окна?</h2><p class="local-lead">В каталоге указан ориентир на изделие — от 6 500 ₽ / м² без монтажа и доставки. Это не цена окна с установкой: итог зависит от размеров, профиля, стеклопакета, числа створок и состава работ.</p><a class="local-button" href="../../calculator/">Рассчитать своё окно</a></section>
    ${links(prefix)}
  </main>`;
  write(`contacts/${slug}`, `Пластиковые окна ${city.where} — купить с установкой | Спектр`, `Окна ПВХ «Спектр» ${city.where}: ${offices.length === 2 ? 'два офиса' : offices[0].street}, телефоны и часы работы. Подбор оконных систем, замер и расчёт стоимости с установкой.`, content);
}
write('catalog/okna', 'Купить пластиковые окна ПВХ — оконные системы и цены | Спектр', 'Пластиковые окна REHAU и PRO WINS от завода «Спектр». Комплектации, примерные цены от 6 500 ₽/м² без монтажа, выбор стеклопакета и расчёт установки.', `<main id="content" class="wrap local-main">
  <nav class="breadcrumbs" aria-label="Хлебные крошки"><a href="../../">Главная</a><span aria-hidden="true">/</span><a href="../">Каталог</a><span aria-hidden="true">/</span><span aria-current="page">Окна ПВХ</span></nav>
  <header class="local-heading"><h1>Пластиковые окна.<br><em class="heading-accent">Под ваше пространство.</em></h1><p>Оконные системы REHAU и PRO WINS для квартиры, дома и балконного блока. Производим окна по размерам заказчика с 2004 года. Выберите профиль и комплектацию под ваши задачи.</p><div class="local-actions"><a class="local-button" href="../?category=windows">Открыть каталог окон</a><a class="local-text-link" href="../../#request">Получить расчёт ↗</a></div></header>
  <section class="local-section"><h2>Какую оконную систему выбрать?</h2><div class="local-grid"><article><h3>Окна REHAU</h3><p>В каталоге представлены Delight Design, Grazio, Intelio и Blitz New. Профиль сравнивайте вместе со стеклопакетом, фурнитурой и схемой открывания.</p><a href="../?category=windows&amp;collection=rehau">Посмотреть окна REHAU ↗</a></article><article><h3>Окна PRO WINS</h3><p>Профильные системы с монтажной глубиной 58 и 70 мм. Подбор зависит от размеров проёма, назначения помещения и требований к остеклению.</p><a href="../?category=windows&amp;collection=pro">Посмотреть PRO WINS ↗</a></article><article><h3>Комплектации «Спектр»</h3><p>«Эконом», «Оптимальный», «Комфорт», «Энерго» и «Элит». Сравните состав каждой комплектации; дополнительные опции согласуем при расчёте.</p><a href="../?category=windows&amp;collection=ready">Сравнить комплектации ↗</a></article><article><h3>Нестандартные окна</h3><p>Арочные конструкции и окна для проёмов необычной формы. Возможность изготовления, размеры и открывание уточняются для конкретного объекта.</p><a href="../?category=windows&amp;collection=custom">Индивидуальные решения ↗</a></article></div></section>
  <section class="local-section"><h2>Цена пластикового окна с установкой.</h2><p class="local-lead">Ориентир в каталоге — от 6 500 ₽ / м² за базовое изделие без монтажа и доставки. Полную стоимость согласуем после замера: она зависит от профиля, стеклопакета, створок и выбранных работ.</p><ul class="local-list"><li>Само окно: размеры, профиль, стеклопакет и фурнитура.</li><li>Работы: доставка, демонтаж старой конструкции и установка.</li><li>Дополнения: подоконник, отлив, сетка и отделка откосов — по согласованию.</li></ul><div class="local-actions"><a class="local-button" href="../../calculator/">Рассчитать изделие</a><a href="../../ustanovka-okon/">Что учесть при установке ↗</a></div></section>
  <section class="local-section"><h2>Где купить окна «Спектр»?</h2><nav class="local-cities" aria-label="Офисы по городам">${Object.entries(cities).map(([slug,c]) => `<a href="../../contacts/${slug}/">${c.title} ↗</a>`).join('')}</nav><p>С образцами и комплектациями поможем разобраться в одном из шести офисов. Запрос на расчёт можно оставить и на сайте.</p></section>
  ${links('../../')}
</main>`);
write('ustanovka-okon', 'Установка пластиковых окон — замер и расчёт монтажа | Спектр', 'Установка окон ПВХ «Спектр»: подготовка к замеру, состав работ и приёмка. Ростов-на-Дону, Азов, Батайск, Кулешовка и Ейск. Расчёт стоимости монтажа.', `<main id="content" class="wrap local-main">
  <nav class="breadcrumbs" aria-label="Хлебные крошки"><a href="../">Главная</a><span aria-hidden="true">/</span><span aria-current="page">Установка окон</span></nav>
  <header class="local-heading"><h1>Установка окон ПВХ.<br><em class="heading-accent">С понятным составом работ.</em></h1><p>Подберём окно, выполним замер и согласуем установку под ваш проём. Обратиться можно в офисы «Спектр» в Ростове-на-Дону, Азове, Батайске, Кулешовке и Ейске.</p><a class="local-button" href="../#request">Обсудить установку</a></header>
  <section class="local-section"><h2>Как проходит заказ?</h2><ol class="local-steps"><li><h3>Предварительный расчёт</h3><p>Сообщите город, примерные размеры и тип помещения. Фото проёма поможет обсудить конструкцию и пожелания.</p></li><li><h3>Замер и комплектация</h3><p>Специалист уточнит размеры и особенности проёма. Согласуем профиль, стеклопакет, открывание и дополнительные элементы.</p></li><li><h3>Согласование работ</h3><p>До заказа уточните сроки, доставку, демонтаж и монтаж, отделку откосов и итоговую сумму. Состав работ фиксируется при согласовании заказа.</p></li><li><h3>Установка и приёмка</h3><p>Проверьте внешний вид, открывание створок, работу ручек и согласованные элементы. Уточните правила ухода и обслуживания.</p></li></ol></section>
  <section class="local-section"><h2>Сколько стоит установка пластиковых окон?</h2><p class="local-lead">Единой цены для любого проёма нет. Расчёт зависит от размеров и массы конструкции, состояния проёма, доступа к нему и необходимости демонтажа и отделки.</p><p>Калькулятор на сайте считает только изделие. Монтаж, доставка, подоконник, отлив, москитная сетка и дополнительные услуги в эту сумму не включены. Полную стоимость заказа согласуем отдельно.</p><div class="local-actions"><a class="local-button" href="../#request">Получить полный расчёт</a><a href="../calculator/">Рассчитать стоимость окна ↗</a></div></section>
  <section class="local-section"><h2>Как подготовить помещение?</h2><p class="local-lead">Освободите доступ к окну, уберите шторы и вещи с подоконника. Защитите мебель от пыли и заранее обсудите со специалистом, куда можно перенести старую конструкцию и строительный мусор.</p><a href="../articles/ustanovka-okon-podgotovka-i-priemka/">Подготовка и приёмка: подробнее ↗</a></section>
  <section class="local-section"><h2>Куда обратиться?</h2><nav class="local-cities" aria-label="Офисы по городам">${Object.entries(cities).map(([slug,c]) => `<a href="../contacts/${slug}/">${c.title} ↗</a>`).join('')}</nav></section>
  ${links('../')}
</main>`);
console.log('Built five office pages, PVC windows and installation pages.');
require('./build-seo').applySeo();
