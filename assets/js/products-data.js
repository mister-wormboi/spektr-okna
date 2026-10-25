/* Existing Spektr assortment. Compatible component information checked against TBM,
 * 2026-10-09; see content/catalog-sources.md. Prices are editorial estimates for
 * finished products, not TBM component prices or an approved Spektr price list. */
(() => {
  const base = 'https://spektr-okna.ru/';
  const ready = 'produkcija/okna/gotovie-reshenija-spektr/';
  const pro = 'produkcija/okna/prowin-profile/';
  const rehau = 'produkcija/okna/okna-rehau/';
  const balcony = 'produkcija/osteklenie-balkonov-i-lodzhij/';
  const doors = 'produkcija/dveri/';
  const gates = 'produkcija/rolstavnivorota/';
  const ceiling = 'produkcija/natjazhnie-potolki/';
  const blinds = 'produkcija/rulonnie-shtori/';
  const aluminium = 'aljuminievie-konstrukcii/';
  window.SPEKTR_PRODUCT_CATEGORIES = [
    { id:'windows', title:'Окна ПВХ', icon:'window', caption:'Пластиковые окна из профилей PRO WINS и REHAU. Готовые комплектации и изготовление по размерам.' },
    { id:'balconies', title:'Остекление балконов и лоджий', icon:'balcony', caption:'Тёплое остекление из ПВХ и холодное алюминиевое остекление балконов и лоджий.' },
    { id:'doors', title:'Двери ПВХ', icon:'door', caption:'Входные, межкомнатные и балконные двери из ПВХ-профиля.' },
    { id:'gates', title:'Ворота и рольставни', icon:'gate', caption:'Рольставни для проёмов, рулонные и секционные гаражные ворота, автоматика.' },
    { id:'ceilings', title:'Натяжные потолки', icon:'ceiling', caption:'Матовые, глянцевые и сатиновые натяжные потолки, фотопечать и двухуровневые конструкции.' },
    { id:'blinds', title:'Рулонные шторы', icon:'blind', caption:'Тканевые рулонные шторы открытого типа и кассетные системы с направляющими.' },
    { id:'aluminium', title:'Алюминиевые конструкции', icon:'aluminium', caption:'Окна, двери, порталы, витрины, фасады и перегородки из алюминиевого профиля.' },
    { id:'components', title:'Фурнитура и комплектующие', icon:'all', caption:'Оконные и дверные ручки, петли для ПВХ-дверей и оконные уплотнители.' }
  ];
  window.SPEKTR_PRODUCT_SUBCATEGORIES = {
    components:[{id:'handles',title:'Оконные ручки',products:['window-handle','locking-handle']},{id:'door-handles',title:'Дверные ручки',products:['door-handle']},{id:'hinges',title:'Петли',products:['hinge']},{id:'seals',title:'Уплотнители',products:['seal']}],
    windows:[{id:'ready',title:'Готовые комплектации',products:['econom','optimal','comfort','energy','elite']},{id:'pro',title:'Профили PRO WINS',products:['pro58','pro70']},{id:'rehau',title:'Окна REHAU',products:['delight','grazio','intelio','blitz']},{id:'custom',title:'Нестандартные окна',products:['unusual']}],
    balconies:[{id:'warm',title:'Тёплое остекление',products:['warm-balcony']},{id:'cold',title:'Холодное остекление',products:['cold-balcony']}],
    doors:[{id:'entrance',title:'Входные двери',products:['entrance']},{id:'interior',title:'Межкомнатные двери',products:['interior']},{id:'balcony',title:'Балконные двери',products:['balcony-door']}],
    gates:[{id:'shutters',title:'Рольставни',products:['shutters']},{id:'gates',title:'Гаражные ворота',products:['roller-gate','sectional']},{id:'automation',title:'Автоматика',products:['automation']}],
    ceilings:[{id:'textures',title:'Матовые, глянцевые и сатиновые',products:['matte','gloss','satin']},{id:'design',title:'Фотопечать и два уровня',products:['print','levels']}],
    blinds:[{id:'open',title:'Открытые рулонные шторы',products:['roller-blind']},{id:'cassette',title:'Кассетные шторы',products:['cassette']}],
    aluminium:[{id:'windows',title:'Окна и панорамное остекление',products:['al-sliding','panoramic']},{id:'doors',title:'Двери, порталы и калитки',products:['al-door','al-portal','al-wicket']},{id:'partitions',title:'Перегородки',products:['office','sanitary']},{id:'facades',title:'Фасады',products:['facade']}]
  };
  const records = [
    ['econom','windows','Окна ПВХ «Спектр Эконом»','Pro Wins · 58 мм','Базовая комплектация пластикового окна для дома и квартиры.', ['Профиль Pro Wins, 58 мм','3 камеры профиля','Стеклопакет 24 мм','Фурнитура Siegenia'],ready,'tilt-window'],
    ['optimal','windows','Окна ПВХ «Спектр Оптимальный»','Pro Wins · 58 мм','Комплектация со стеклопакетом с теплосберегающим покрытием.', ['Профиль Pro Wins, 58 мм','3 камеры профиля','Стеклопакет 24 мм','Фурнитура Siegenia'],ready,'transom'],
    ['comfort','windows','Окна ПВХ «Спектр Комфорт»','REHAU Euro-Design','Оконная система с теплосберегающим стеклопакетом и двухлепестковым уплотнителем.', ['Профиль REHAU Euro-Design, 60 мм','3 камеры профиля','Стеклопакет 24 мм','Фурнитура Siegenia'],ready,'tilt-window'],
    ['energy','windows','Окна ПВХ «Спектр Энерго»','REHAU · ClimaGuard Solar','Комплектация с мультифункциональным стеклом для защиты от солнца и сохранения тепла.', ['Профиль REHAU Intelio','Мультифункциональный стеклопакет ClimaGuard Solar','Фурнитура Siegenia','Микропроветривание'],ready,'tilt-window'],
    ['elite','windows','Окна ПВХ «Спектр Элит»','REHAU Delight Design','Комплектация с мультифункциональным стеклопакетом и противовзломной фурнитурой.', ['Профиль REHAU Delight Design, 70 мм','5 камер профиля','Стеклопакет ClimaGuard Solar, 32 мм','Противовзломная фурнитура Siegenia'],ready,'transom'],
    ['pro58','windows','Окна ПВХ PRO WINS 58','Профиль · 58 мм','Профильная система для пластиковых окон с монтажной глубиной 58 мм.', ['Монтажная глубина 58 мм','4 камеры профиля','Индивидуальные размеры'],pro,'tilt-window'],
    ['pro70','windows','Окна ПВХ PRO WINS 70','Профиль · 70 мм','Пятикамерная профильная система с монтажной глубиной 70 мм.', ['Монтажная глубина 70 мм','5 камер профиля','Индивидуальная комплектация'],pro,'tilt-window'],
    ['unusual','windows','Окна ПВХ нестандартной формы','Индивидуальная форма','Окна для проёмов нестандартной формы и размеров.', ['Арочные конструкции','Мансардные решения','Изготовление по размерам'], 'produkcija/okna/','transom'],
    ['delight','windows','Окна ПВХ REHAU Delight Design','Профиль REHAU','Профильная система из линейки окон REHAU в ассортименте «Спектр».', ['Подбор стеклопакета и открывания','Изготовление по размерам'],rehau,'tilt-window'],
    ['grazio','windows','Окна ПВХ REHAU Grazio','Профиль REHAU','Система REHAU для остекления жилых помещений.', ['Подбор цвета и комплектации','Изготовление по размерам'],rehau,'tilt-window'],
    ['intelio','windows','Окна ПВХ REHAU Intelio','Профиль REHAU','Оконная система с индивидуальным подбором стеклопакета и фурнитуры.', ['Подбор комплектации под помещение','Изготовление по размерам'],rehau,'transom'],
    ['blitz','windows','Окна ПВХ REHAU Blitz New','Профиль REHAU','Профильная система REHAU для пластиковых окон.', ['Подбор створок и открывания','Изготовление по размерам'],rehau,'tilt-window'],
    ['warm-balcony','balconies','Тёплое остекление балкона из ПВХ','ПВХ · балконы и лоджии','Остекление с профилем ПВХ и стеклопакетом для сохранения тепла.', ['Профиль ПВХ со стеклопакетом','Поворотные и поворотно-откидные створки','Возможность внутренней отделки'],balcony,'balcony-block'],
    ['cold-balcony','balconies','Холодное алюминиевое остекление балкона','Алюминий · балконы и лоджии','Лёгкие алюминиевые конструкции для балконов и лоджий без жилого утепления.', ['Алюминиевые рамы','Возможность раздвижного открывания','Подбор по состоянию основания'],balcony],
    ['entrance','doors','Входные двери ПВХ','ПВХ · входная группа','Металлопластиковые двери для входа в дом или помещение.', ['Подбор заполнения','Изготовление по размерам','Индивидуальная комплектация'],doors,'entrance-door'],
    ['interior','doors','Межкомнатные двери ПВХ','ПВХ · интерьер','Пластиковые двери для разделения внутренних помещений.', ['Глухое или остеклённое исполнение','Подбор под интерьер'],doors],
    ['balcony-door','doors','Балконные двери ПВХ','ПВХ · выход на балкон','Металлопластиковые двери для выхода на балкон или лоджию.', ['Изготовление по размерам','Подбор фурнитуры и стеклопакета'],doors,'balcony-door'],
    ['shutters','gates','Рольставни','Роллетные системы','Роллетные конструкции для защиты оконных и дверных проёмов.', ['Ручное или автоматическое управление','Подбор по размерам проёма'],gates],
    ['roller-gate','gates','Рулонные гаражные ворота','Роллетные системы','Ворота с полотном, которое сворачивается в короб над проёмом.', ['Ручное или автоматическое управление','Изготовление под проём'],gates],
    ['sectional','gates','Секционные гаражные ворота','Гаражные решения','Секционные ворота для гаража с подбором управления.', ['Подбор размеров','Возможность автоматизации'],gates],
    ['automation','gates','Автоматика для ворот','Управление','Системы автоматического управления воротами.', ['Для разных видов ворот','Подбор совместимого оборудования'],gates],
    ['matte','ceilings','Матовые натяжные потолки','Натяжные потолки','Полотно с ровной матовой поверхностью без выраженных бликов.', ['Матовая фактура','Подбор цвета и освещения'],ceiling,'ceiling'],
    ['gloss','ceilings','Глянцевые натяжные потолки','Натяжные потолки','Полотно с отражающей поверхностью для световых акцентов в интерьере.', ['Глянцевая фактура','Подбор цвета и освещения'],ceiling,'ceiling'],
    ['satin','ceilings','Сатиновые натяжные потолки','Натяжные потолки','Полотно с мягким блеском и шелковистой фактурой.', ['Сатиновая фактура','Подбор цвета'],ceiling,'ceiling'],
    ['print','ceilings','Натяжные потолки с фотопечатью','Натяжные потолки','Натяжное полотно с выбранным изображением.', ['Индивидуальный рисунок','Подбор под интерьер'],ceiling],
    ['levels','ceilings','Двухуровневые натяжные потолки','Натяжные потолки','Многоуровневое решение для зонирования помещения и организации света.', ['Два уровня','Возможность скрыть коммуникации'],ceiling],
    ['roller-blind','blinds','Рулонные шторы открытого типа','Текстиль для окон','Тканевые шторы с регулировкой высоты для пластиковых и деревянных окон.', ['Выбор фактур и расцветок','Подбор по размерам окна'],blinds,'mini-blind'],
    ['cassette','blinds','Кассетные рулонные шторы','Короб и направляющие','Рулонные шторы с коробом, в который убирается ткань.', ['Закрытый короб','Направляющие для ткани','Выбор фактуры и расцветки'],blinds,'uni-blind'],
    ['al-sliding','aluminium','Раздвижные алюминиевые окна','Алюминиевые конструкции','Раздвижные оконные системы из алюминиевого профиля.', ['Раздвижные створки','Индивидуальные размеры'],aluminium],
    ['al-door','aluminium','Алюминиевые двери','Алюминиевые конструкции','Двери и входные группы для частных и коммерческих объектов.', ['Подбор заполнения','Изготовление под проём'],aluminium],
    ['al-portal','aluminium','Алюминиевые порталы','Алюминиевые конструкции','Портальные конструкции для широких светопрозрачных проёмов.', ['Индивидуальные размеры','Подбор системы'],aluminium],
    ['al-wicket','aluminium','Алюминиевые калитки','Алюминиевые конструкции','Калитки из алюминия для организации входа на участок.', ['Подбор размеров и исполнения'],aluminium],
    ['panoramic','aluminium','Панорамное остекление и витрины','Алюминиевые конструкции','Светопрозрачные конструкции для больших проёмов и витрин.', ['Панорамные решения','Изготовление под объект'],aluminium],
    ['office','aluminium','Алюминиевые офисные перегородки','Алюминиевые конструкции','Перегородки из алюминиевого профиля для разделения пространства.', ['Зонирование офисов','Индивидуальная конфигурация'],aluminium],
    ['facade','aluminium','Алюминиевые фасады','Алюминиевые конструкции','Фасадные конструкции из алюминиевого профиля.', ['Проектирование под объект','Индивидуальная конфигурация'],aluminium],
    ['sanitary','aluminium','Сантехнические перегородки','Алюминиевые конструкции','Перегородки для кабинок, душевых и раздевалок.', ['Разделение общих помещений','Изготовление по размерам'],aluminium],
    ['window-handle','components','Оконная ручка','Фурнитура для окна','Ручка для управления оконной створкой. Совместимость с установленным механизмом уточняется при подборе.', ['Подбор длины штифта','Подбор цвета и крепления'],'produkcija/okna/'],
    ['locking-handle','components','Оконная ручка с замком','Фурнитура для окна','Ручка с запиранием на ключ. Исполнение и совместимость подбираются под оконную створку.', ['Запирание на ключ','Совместимость — по механизму'],'produkcija/okna/'],
    ['door-handle','components','Дверные ручки','Фурнитура для двери','Комплект нажимных ручек для двери. Размеры, крепления и совместимость с замком уточняются при подборе.', ['Подбор под замок','Сторона и материал двери'],doors],
    ['hinge','components','Дверная петля','Фурнитура для двери','Регулируемая петля для ПВХ-двери. Модель подбирается по профилю, размерам и массе полотна.', ['Подбор под профиль','Регулировка положения полотна'],doors],
    ['seal','components','Оконный уплотнитель','Комплектующие для окна','Эластичное уплотнение притвора. Сечение подбирается по пазу установленной оконной системы.', ['Подбор сечения','Совместимость с профилем'],'produkcija/okna/']
  ];
  // One existing estimate per direction, never a separate price for each profile.
  const priceExamples = {
    windows:['Пластиковое окно',6500,'м²','econom'],
    balconies:['Холодное остекление балкона',5000,'м²','cold-balcony'],
    doors:['Балконная дверь',14000,'шт.','balcony-door'],
    gates:['Рольворота',45000,'компл.','roller-gate'],
    ceilings:['Матовый потолок',700,'м²','matte'],
    blinds:['Рулонная штора',1800,'шт.','roller-blind'],
    aluminium:['Раздвижное алюминиевое окно',6000,'м²','al-sliding']
  };
  const priceFormat = new Intl.NumberFormat('ru-RU');
  window.SPEKTR_PRICE_GUIDES = Object.fromEntries(Object.entries(priceExamples).map(([category,[title,amount,unit,productId]]) => [category,{
    title,amount,unit,productId,label:`от ${priceFormat.format(amount)} ₽ / ${unit}`,
    note:'Цены примерные, не являются публичной офертой. Без монтажа и доставки. Итоговую стоимость рассчитаем после замера и согласования комплектации.'
  }]));
  // Selection criteria, not a promise that every supplier option is included.
  const selection = {
    windows:['Фурнитура подбирается по профилю, размеру и массе створки','Тип открывания и защита от случайного открывания — по согласованию'],
    doors:['Петли и замок подбираются под материал и массу полотна','Сторона открывания, ручки и порог — по согласованию']
  };
  const details = {
    'warm-balcony':{description:'Остекление со стеклопакетом для балкона или лоджии. Теплоизоляцию подбираем вместе с утеплением пола, стен и потолка.',features:['ПВХ-профиль со стеклопакетом','Поворотное или поворотно-откидное открывание','Уплотнение и фурнитура под размеры створок']},
    'cold-balcony':{description:'Алюминиевое остекление для защиты балкона от осадков и ветра. Подходит для пространства без жилого утепления.',features:['Холодная алюминиевая система','Раздвижные створки на роликах — по согласованию','Щёточные уплотнители и защёлки под выбранную систему']},
    entrance:{description:'ПВХ-дверь для входа в дом или помещение. Заполнение, замок, петли и порог подбираются с учётом проёма и нагрузки.'},
    interior:{description:'ПВХ-дверь для внутренних помещений. Глухое или остеклённое полотно, ручки и защёлка подбираются под интерьер.'},
    'balcony-door':{description:'Дверь со стеклопакетом для выхода на балкон или лоджию. Открывание, прижим, ручку и балконную защёлку согласуем при расчёте.'},
    'al-sliding':{description:'Алюминиевые окна с перемещением створок вдоль направляющих. Систему и ролики подбираем по размерам и массе створок.',features:['Раздвижное открывание','Ролики и направляющие одной системы','Подбор уплотнения и запирания']},
    'al-door':{description:'Алюминиевые двери для входных групп и внутренних помещений. Тёплое или холодное исполнение выбирается по условиям эксплуатации.',features:['Система с терморазрывом или без него','Петли под массу полотна','Замок, порог и доводчик — по согласованию']},
    'al-portal':{description:'Раздвижной выход на террасу или в сад. Фурнитура и схема открывания подбираются под ширину проёма и массу остекления.',features:['Раздвижная или подъёмно-сдвижная система — по проекту','Каретки и запоры под массу створки','Подбор теплоизоляции и порога']},
    panoramic:{description:'Большие светопрозрачные проёмы и витрины. Профили и стеклопакеты подбираются с учётом теплоизоляции и расчётных нагрузок.',features:['Тёплое или холодное остекление','Глухие и открывающиеся секции — по проекту','Подбор профиля по размерам и нагрузкам']},
    office:{description:'Алюминиевые перегородки для зонирования офиса. Остекление, непрозрачное заполнение и дверные секции согласуются под планировку.',features:['Профиль для внутренних перегородок','Стекло или непрозрачное заполнение','Дверные секции — по проекту']},
    facade:{description:'Светопрозрачный алюминиевый фасад для коммерческого или жилого объекта. Сечение стоек и ригелей определяется расчётом.',features:['Стоечно-ригельная система','Уплотнение и отвод воды из узлов','Подбор стеклопакетов и креплений по проекту']}
  };
  const referenceByCategory = {
    windows:'https://www.tbm.ru/furnitura-dlya-okon',
    doors:'https://www.tbm.ru/furnitura-dlya-dverey',
    balconies:'https://www.tbm.ru/profili-i-komplektuyuschie-dlya-balkonnogo-ostekleniya',
    aluminium:'https://www.tbm.ru/alyuminievye-sistemy-alumark'
  };
  const sceneImages={
    econom:'window',optimal:'window',comfort:'window',energy:'window',elite:'window',delight:'window',grazio:'window',intelio:'window',blitz:'window',pro58:'profile',pro70:'profile',
    'warm-balcony':'balconies',entrance:'doors',sectional:'gates',matte:'ceilings',cassette:'blinds','al-portal':'aluminium'
  };
  window.SPEKTR_PRODUCTS = records.map(([id,category,title,subtitle,description,features,source,image]) => ({
    id,category,title,subtitle,description,features,source:base+source,
    image:image ? `assets/catalog/${image}.webp` : null,
    catalogImage:`assets/catalog/scene-${sceneImages[id] || id}-v1.webp`,
    ...details[id],
    features:[...(details[id]?.features || features),...(selection[category] || [])],
    priceNote:'Точную стоимость рассчитаем по вашим размерам и комплектации. Монтаж и доставка рассчитываются отдельно.',
    tbmReference:['al-wicket','sanitary'].includes(id) ? null : (referenceByCategory[category] || null)
  }));
  window.SPEKTR_CATALOG_DIRECTIONS = window.SPEKTR_PRODUCT_CATEGORIES.map(category => {
    const representative = window.SPEKTR_PRODUCTS.find(product => product.id === priceExamples[category.id]?.[3])
      || window.SPEKTR_PRODUCTS.find(product => product.category === category.id);
    return {...representative,id:category.id,title:category.title,
      description:category.caption,features:[],isDirection:true,priceGuide:window.SPEKTR_PRICE_GUIDES[category.id]};
  });
  const collectionCopy = {
    ready:['Окна ПВХ «Спектр»','Пять комплектаций: от базового «Эконом» до «Элит». Подберём подходящую для вашего дома.'],
    pro:['Окна ПВХ PRO WINS','Профильные системы 58 и 70 мм. Выбор глубины профиля и стеклопакета под вашу задачу.'],
    rehau:['Окна ПВХ REHAU','Delight Design, Grazio, Intelio и Blitz New. Поможем разобраться в различиях.'],
    custom:['Окна ПВХ нестандартной формы','Арочные и другие нестандартные формы. Изготовление под ваш проём.']
  };
  window.SPEKTR_WINDOW_COLLECTIONS = window.SPEKTR_PRODUCT_SUBCATEGORIES.windows.map(group => ({
    ...window.SPEKTR_PRODUCTS.find(product => product.id===group.products[0]),
    id:group.id,title:collectionCopy[group.id][0],description:collectionCopy[group.id][1],
    features:[],isCollection:true
  }));
})();
