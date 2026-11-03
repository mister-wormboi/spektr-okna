# База сайта «Спектр» для админки

Проектная ER-модель для переноса текущих HTML/JSON/JS-данных в управляемую базу. База и сервер админки пока не созданы. Заявки и сотрудники CRM остаются в Битрикс24 и не входят в эту модель.

```mermaid
erDiagram
    ROLES ||--o{ USERS : grants
    USERS ||--o{ AUDIT_LOG : performs
    USERS o|--o{ ARTICLES : edits
    PAGES ||--o{ PAGE_BLOCKS : contains
    MEDIA o|--o{ PAGE_BLOCKS : illustrates
    CATEGORIES o|--o{ CATEGORIES : groups
    CATEGORIES ||--o{ PRODUCTS : contains
    CATEGORIES ||--o| PRICE_GUIDES : estimates
    PRODUCTS ||--o{ PRODUCT_ATTRIBUTES : describes
    PRODUCTS ||--o{ PRODUCT_MEDIA : illustrates
    MEDIA ||--o{ PRODUCT_MEDIA : references
    MEDIA o|--o{ ARTICLES : covers
    PROJECTS ||--o{ PROJECT_MEDIA : contains
    MEDIA ||--o{ PROJECT_MEDIA : references
    BRANCHES o|--o{ PROJECTS : serves
    BRANCHES ||--o{ REVIEWS : receives

    ROLES {
        bigint id PK
        varchar code UK
        varchar name
        json permissions
    }
    USERS {
        bigint id PK
        bigint role_id FK
        varchar email UK
        varchar password_hash
        varchar name
        boolean active
    }
    PAGES {
        bigint id PK
        varchar slug UK
        varchar title
        varchar seo_title
        text seo_description
        varchar status
        datetime updated_at
    }
    PAGE_BLOCKS {
        bigint id PK
        bigint page_id FK
        bigint media_id FK
        varchar block_type
        varchar title
        json content
        int position
        boolean visible
    }
    MEDIA {
        bigint id PK
        varchar storage_key UK
        varchar mime_type
        varchar alt_text
        int width
        int height
        bigint size_bytes
        json variants
    }
    CATEGORIES {
        bigint id PK
        bigint parent_id FK
        varchar slug UK
        varchar title
        text description
        int position
        boolean visible
    }
    PRODUCTS {
        bigint id PK
        bigint category_id FK
        varchar slug UK
        varchar title
        varchar subtitle
        text description
        varchar source_url
        varchar status
        int position
    }
    PRODUCT_ATTRIBUTES {
        bigint id PK
        bigint product_id FK
        varchar name
        text value
        varchar unit
        int position
    }
    PRODUCT_MEDIA {
        bigint product_id PK,FK
        bigint media_id PK,FK
        varchar purpose
        int position
    }
    PRICE_GUIDES {
        bigint id PK
        bigint category_id FK,UK
        varchar example_title
        decimal amount_from
        varchar unit
        text disclaimer
    }
    ARTICLES {
        bigint id PK
        bigint editor_id FK
        bigint cover_media_id FK
        varchar slug UK
        varchar legacy_slug UK
        varchar title
        varchar category
        text description
        json body
        varchar seo_title
        text seo_description
        varchar status
        datetime published_at
    }
    PROJECTS {
        bigint id PK
        bigint branch_id FK
        varchar title
        varchar project_type
        varchar city
        text description
        int position
        boolean published
    }
    PROJECT_MEDIA {
        bigint project_id PK,FK
        bigint media_id PK,FK
        varchar caption
        varchar purpose
        int position
        boolean show_on_home
    }
    BRANCHES {
        bigint id PK
        varchar city
        varchar region
        varchar address
        varchar phone
        varchar email
        text opening_hours
        decimal latitude
        decimal longitude
        varchar map_url
        varchar yandex_organization_id UK
        decimal external_rating
        datetime rating_checked_at
        int position
        boolean active
    }
    REVIEWS {
        bigint id PK
        bigint branch_id FK
        varchar author
        int rating
        text body
        varchar source
        varchar external_id
        varchar source_url
        date published_at
        varchar source_date_label
        json topics
        boolean show_on_home
        boolean show_on_reviews_page
        int home_position
        int page_position
        varchar status
    }
    FAQ {
        bigint id PK
        text question
        text answer
        varchar topic
        boolean show_on_home
        int position
        boolean published
    }
    SITE_SETTINGS {
        varchar key PK
        json value
        datetime updated_at
    }
    CALCULATOR_CONFIGS {
        bigint id PK
        int version UK
        json parameters
        json pricing_rules
        text disclaimer
        boolean active
        datetime updated_at
    }
    AUDIT_LOG {
        bigint id PK
        bigint user_id FK
        varchar entity_type
        varchar entity_id
        varchar action
        json changes
        datetime created_at
    }
```

## Что редактируется

| Раздел админки | Таблицы |
|---|---|
| Страницы и порядок блоков | `pages`, `page_blocks` |
| Каталог: направления и подкатегории | `categories` с родительской категорией |
| Названия, описания и характеристики товаров | `products`, `product_attributes` |
| Примерные цены по направлениям | `price_guides`: один пример на категорию |
| Фото, видео и их облегчённые версии | `media` |
| Статьи | `articles` |
| Примеры работ, галерея и «до / после» | `projects`, `project_media` |
| Филиалы, контакты и оценки | `branches` |
| Отзывы и отдельные подборки для главной/страницы отзывов | `reviews` |
| Вопросы и ответы | `faq` |
| Логотипы, темы, общие контакты, меню и настройки интеграций | `site_settings` |
| Размеры, профили и правила расчёта калькулятора | `calculator_configs` |
| Доступ в админку и журнал изменений | `users`, `roles`, `audit_log` |

## Ограничения модели

- PK — первичный ключ; FK — внешний ключ; UK — уникальное значение. Необязательные связи допускают NULL.
- Категория товара — конечная подкатегория. Вложенность восстанавливает полное направление, например «Окна ПВХ → REHAU».
- В `price_guides.amount_from` используется точный десятичный тип, не float. Сумма неотрицательна. Единица измерения хранится отдельно.
- Оценка отзыва — целое число от 1 до 5. Внешний идентификатор отзыва уникален в пределах источника, если он известен.
- Две подборки отзывов независимы. Изменение `show_on_reviews_page` и `page_position` не меняет главную.
- `project_media.purpose` различает обычную фотографию, «до» и «после». Для одного проекта допускается не более одного изображения каждого из типов «до» и «после».
- JSON используется для упорядоченного содержимого блоков и статей, а также конфигурации. Он валидируется по типу блока. Файлы не встраиваются в JSON: для вложенных изображений статей и блоков потребуются отдельные таблицы связей с `media` при детализации редактора.
- `media.variants` содержит пути, размеры и форматы производных версий одного файла. Сами фото и видео хранятся в файловом/объектном хранилище, в БД — их метаданные.
- Связь `audit_log.entity_type/entity_id` — ссылка журнала на разные типы объектов, а не внешний ключ. Записи журнала сохраняются после удаления контента.
- Публикации используют статусы `draft`, `published`, `archived`. Для справочников и блоков применяются флаги видимости.
- Активна только одна версия конфигурации калькулятора. Изменение расчётных правил публикуется новой версией.
- Секреты интеграций хранятся на сервере в защищённых настройках, не в общедоступном `site_settings` и не в коде сайта.

Это основа для проектирования админки. В текущем статическом сайте серверная БД не подключена; для сохранения изменений из админки понадобится backend/API.
