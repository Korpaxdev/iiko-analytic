# iiko Analytics API

REST API для работы с аналитикой iiko через OLAP-отчеты.

## Стек технологий

- **Go** 1.25.0
- **Fiber** v2 - веб-фреймворк
- **Resty** - HTTP клиент для работы с iiko API
- **go-cache** - in-memory кэширование с сжатием
- **validator/v10** - валидация входящих данных

## Возможности

- Получение OLAP-отчетов из iiko
- Получение списка доступных полей для отчетов
- Загрузка сохраненных пресетов отчетов из iiko
- Конструирование JSON запросов для iiko API
- Веб-интерфейс с автоматической загрузкой полей и пресетов
- Поддержка группировки по строкам (groupByRowFields) и столбцам (groupByColFields)
- Автоматическое кэширование запросов к iiko
- Компрессия ответов (gzip/brotli)
- HTTP/2 ready
- ETag кэширование для статики

## Запуск

### Через Docker Compose (рекомендуется)

```bash
# Запуск всего стека (API + Caddy)
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

Сервисы:

- **API**: доступен на порту `8080` (внутри docker сети)
- **Caddy**: доступен на портах `80` (HTTP) и `443` (HTTPS)

### Локальная разработка

```bash
# Запуск API сервера
go run cmd/api/main.go
```

Сервер запускается на порту `:8080`

### Для разработки (hot reload)

```bash
# Используя air
air -c api.air.toml
```

## API Endpoints

### `GET /`

Веб-интерфейс (dashboard) для работы с API.

**Возможности:**

- Автоматическая загрузка доступных полей при заполнении данных подключения (с debounce)
- Автоматическая загрузка сохраненных пресетов из iiko
- Выбор пресета для автозаполнения всех полей отчета
- Раздельная группировка по строкам (Row) и столбцам (Col)
- Автокомплит для полей группировки, агрегации и фильтров
- Две кнопки действий:
  - **Выполнить запрос** - получение и отображение данных в таблице
  - **Сконструировать запрос** - получение JSON тела запроса для iiko API с подсветкой синтаксиса
- Поддержка темной темы
- Сохранение настроек подключения в localStorage

**Особенности:**

- Модульная структура JavaScript (7 отдельных модулей)
- ETag кэширование для всех статических ресурсов
- Cache-Control: 1 год для JS, 1 час для HTML
- HTTP/2 Server Push для CDN
- Плавающая кнопка scroll-to-top при прокрутке

### `GET /static/js/*`

Статические JavaScript модули для веб-интерфейса.

**Модули:**

- `main.js` - инициализация и глобальные переменные
- `utils.js` - утилиты (тема, localStorage, debounce)
- `fields.js` - работа с полями (Group By, Aggregate)
- `filters.js` - работа с фильтрами
- `clear-fields.js` - очистка всех полей и фильтров OLAP отчета
- `query.js` - выполнение и конструирование запросов
- `json-highlight.js` - подсветка синтаксиса JSON

**Особенности:**

- ETag кэширование
- Cache-Control: 1 год (immutable)
- Встраивание через Go embed

---

### `POST /fields`

Получение списка доступных полей для указанного типа отчета.

**Request Body:**

```json
{
  "baseURL": "https://your-iiko-instance.com",
  "user": "your-username",
  "passwordHash": "your-password-hash",
  "reportType": "SALES"
}
```

**Параметры:**

- `baseURL` (string, required) - URL вашего iiko сервера
- `user` (string, required) - имя пользователя
- `passwordHash` (string, required) - хэш пароля
- `reportType` (string, required) - тип отчета: `SALES` или `TRANSACTIONS`

**Response:**

```json
{
  "fields": [
    {
      "name": "DishName",
      "displayName": "Название блюда",
      "type": "string"
    },
    ...
  ]
}
```

---

### `POST /olap`

Получение OLAP-отчета с группировкой, агрегацией и фильтрацией данных.

**Request Body:**

```json
{
  "baseURL": "https://your-iiko-instance.com",
  "user": "your-username",
  "passwordHash": "your-password-hash",
  "reportType": "SALES",
  "groupByRowFields": ["DepartmentName", "DishCategory"],
  "aggregateFields": ["UniqAmount.Profit", "DishDiscountSum"],
  "filters": {
    "DepartmentName": {
      "filterType": "IncludeValues",
      "values": ["Кухня", "Бар"]
    }
  },
  "from": "2024-01-01",
  "to": "2024-01-31"
}
```

**Параметры:**

- `baseURL` (string, required) - URL вашего iiko сервера
- `user` (string, required) - имя пользователя
- `passwordHash` (string, required) - хэш пароля
- `reportType` (string, required) - тип отчета: `SALES` или `TRANSACTIONS`
- `groupByRowFields` ([]string, optional) - поля для группировки по строкам
- `groupByColFields` ([]string, optional) - поля для группировки по столбцам
- `aggregateFields` ([]string, optional) - поля для агрегации
- `filters` (map[string]Filter, optional) - фильтры по полям
  - `filterType` (string) - тип фильтра: `IncludeValues` или `ExcludeValues`
  - `values` ([]string) - значения для фильтрации
- `from` (string, required) - дата начала периода (формат: `YYYY-MM-DD`)
- `to` (string, required) - дата окончания периода (формат: `YYYY-MM-DD`)

**Валидация:**

- Дата `to` должна быть >= даты `from`

**Response:**

```json
[
  {
    "DepartmentName": "Кухня",
    "DishCategory": "Горячие блюда",
    "UniqAmount.Profit": 15000.50,
    "DishDiscountSum": 1200.00
  }
]
```

**Ошибки:**

```json
{
  "error": "validation failed",
  "details": {
    "fieldName": "error description"
  }
}
```

---

### `POST /olap-body`

Конструирование JSON тела запроса для iiko OLAP API. Не выполняет запрос к iiko, а возвращает готовое тело запроса, которое можно использовать для прямого обращения к iiko API.

**Request Body:**

```json
{
  "baseURL": "https://your-iiko-instance.com",
  "user": "your-username",
  "passwordHash": "your-password-hash",
  "reportType": "SALES",
  "groupByRowFields": ["DepartmentName", "DishCategory"],
  "aggregateFields": ["UniqAmount.Profit", "DishDiscountSum"],
  "filters": {
    "DepartmentName": {
      "filterType": "IncludeValues",
      "values": ["Кухня", "Бар"]
    }
  },
  "from": "2024-01-01",
  "to": "2024-01-31"
}
```

**Параметры:**

Идентичны параметрам endpoint `/olap`.

**Response:**

```json
{
  "reportType": "SALES",
  "groupByRowFields": ["DepartmentName", "DishCategory"],
  "aggregateFields": ["UniqAmount.Profit", "DishDiscountSum"],
  "filters": {
    "DepartmentName": {
      "filterType": "IncludeValues",
      "values": ["Кухня", "Бар"]
    },
    "OpenDate.Typed": {
      "filterType": "DateRange",
      "from": "2024-01-01",
      "to": "2024-01-31",
      "includeHigh": true,
      "includeLow": true,
      "periodType": "CUSTOM"
    }
  }
}
```

**Использование:**

Этот endpoint полезен для:

- Отладки запросов к iiko API
- Создания документации
- Генерации примеров запросов
- Интеграции с другими системами

**Ошибки:**

Аналогичны endpoint `/olap`.

---

### `POST /olap-presets`

Получение списка сохраненных пресетов OLAP-отчетов из iiko.

**Request Body:**

```json
{
  "baseURL": "https://your-iiko-instance.com",
  "user": "your-username",
  "passwordHash": "your-password-hash"
}
```

**Параметры:**

- `baseURL` (string, required) - URL вашего iiko сервера
- `user` (string, required) - имя пользователя
- `passwordHash` (string, required) - хэш пароля

**Response:**

```json
[
  {
    "id": "08429b71-6836-50d5-018a-ad5308c5002c",
    "name": "Доставки по рекламе",
    "reportType": "DELIVERIES",
    "groupByRowFields": ["Department", "MarketingSource"],
    "groupByColFields": ["Delivery.IsDelivery"],
    "aggregateFields": ["UniqOrderId.OrdersCount", "DishDiscountSumInt"],
    "filters": {
      "DeletedWithWriteoff": {
        "filterType": "IncludeValues",
        "values": ["NOT_DELETED"]
      },
      "Delivery.IsDelivery": {
        "filterType": "IncludeValues",
        "values": ["DELIVERY_ORDER"]
      }
    },
    "buildSummary": null
  }
]
```

**Использование:**

Этот endpoint полезен для:

- Загрузки сохраненных конфигураций отчетов
- Автоматического заполнения полей в веб-интерфейсе
- Быстрого доступа к часто используемым отчетам
- Синхронизации пресетов между системами

**Особенности веб-интерфейса:**

- Пресеты загружаются автоматически при заполнении credentials
- Select с пресетами фильтруется по выбранному `reportType`
- При выборе пресета автоматически заполняются все поля (groupByRowFields, groupByColFields, aggregateFields, filters)

**Ошибки:**

Аналогичны endpoint `/olap`.

## Архитектура

```
.
├── cmd/api/              # Entry point
├── internal/
│   ├── api/              # API слой
│   │   ├── common/       # Общие структуры (OlapBody)
│   │   ├── routes/       # Роуты
│   │   │   ├── dashboard/
│   │   │   │   ├── static/js/  # JavaScript модули
│   │   │   │   └── templates/  # HTML шаблоны
│   │   │   ├── fields/
│   │   │   ├── olap/
│   │   │   ├── olap_body/
│   │   │   └── olap_presets/
│   │   └── utils/        # Утилиты (validator, handler)
│   ├── cache/            # Кэширование с сжатием
│   └── iiko/             # Интеграция с iiko API
│       ├── dto/          # Data Transfer Objects
│       ├── routes/       # API методы iiko
│       └── utils/        # Утилиты для работы с iiko
└── go.mod
```

## Особенности реализации

### Кэширование

- Используется in-memory кэш с автоматическим сжатием данных
- TTL настраивается индивидуально для разных типов данных
- Автоматическая очистка устаревших записей

### Оптимизация

- Компрессия ответов (gzip/brotli)
- ETag для статических ресурсов
- HTTP/2 готовность
- Настроенные буферы для оптимальной производительности

### Безопасность

- Автоматический logout после каждого запроса к iiko
- Валидация всех входящих данных
- Обработка ошибок без раскрытия внутренних деталей

## Примеры использования

### Получение полей для отчета по продажам

```bash
curl -X POST http://localhost:8080/fields \
  -H "Content-Type: application/json" \
  -d '{
    "baseURL": "https://demo.iiko.ru",
    "user": "user",
    "passwordHash": "hash",
    "reportType": "SALES"
  }'
```

### Получение отчета с группировкой

```bash
curl -X POST http://localhost:8080/olap \
  -H "Content-Type: application/json" \
  -d '{
    "baseURL": "https://demo.iiko.ru",
    "user": "user",
    "passwordHash": "hash",
    "reportType": "SALES",
    "groupByRowFields": ["DepartmentName"],
    "aggregateFields": ["UniqAmount.Profit"],
    "from": "2024-01-01",
    "to": "2024-01-31"
  }'
```

### Получение отчета с фильтрами

```bash
curl -X POST http://localhost:8080/olap \
  -H "Content-Type: application/json" \
  -d '{
    "baseURL": "https://demo.iiko.ru",
    "user": "user",
    "passwordHash": "hash",
    "reportType": "SALES",
    "groupByRowFields": ["DishCategory"],
    "aggregateFields": ["DishDiscountSum"],
    "filters": {
      "DepartmentName": {
        "filterType": "IncludeValues",
        "values": ["Кухня"]
      }
    },
    "from": "2024-01-01",
    "to": "2024-01-31"
  }'
```

### Конструирование JSON запроса

```bash
curl -X POST http://localhost:8080/olap-body \
  -H "Content-Type: application/json" \
  -d '{
    "baseURL": "https://demo.iiko.ru",
    "user": "user",
    "passwordHash": "hash",
    "reportType": "SALES",
    "groupByRowFields": ["DepartmentName"],
    "aggregateFields": ["UniqAmount.Profit"],
    "from": "2024-01-01",
    "to": "2024-01-31"
  }'
```

**Ответ:**

```json
{
  "reportType": "SALES",
  "groupByRowFields": ["DepartmentName"],
  "aggregateFields": ["UniqAmount.Profit"],
  "filters": {
    "OpenDate.Typed": {
      "filterType": "DateRange",
      "from": "2024-01-01",
      "to": "2024-01-31",
      "includeHigh": true,
      "includeLow": true,
      "periodType": "CUSTOM"
    }
  }
}
```

### Получение сохраненных пресетов

```bash
curl -X POST http://localhost:8080/olap-presets \
  -H "Content-Type: application/json" \
  -d '{
    "baseURL": "https://demo.iiko.ru",
    "user": "user",
    "passwordHash": "hash"
  }'
```

**Ответ:**

```json
[
  {
    "id": "08429b71-6836-50d5-018a-ad5308c5002c",
    "name": "Доставки по рекламе",
    "reportType": "DELIVERIES",
    "groupByRowFields": ["Department", "MarketingSource"],
    "groupByColFields": ["Delivery.IsDelivery"],
    "aggregateFields": ["UniqOrderId.OrdersCount", "DishDiscountSumInt"],
    "filters": {
      "DeletedWithWriteoff": {
        "filterType": "IncludeValues",
        "values": ["NOT_DELETED"]
      }
    }
  }
]
```

## Разработка

### Структура хэндлера

Каждый роут реализует интерфейс `HandlerInterface`:

```go
type HandlerInterface interface {
    Method() string
    Route() string
    Handler() fiber.Handler
}
```

### Добавление нового роута

1. Создать пакет в `internal/api/routes/`
2. Реализовать хэндлер с использованием `utils.NewHandler`
3. Добавить в `cmd/api/main.go`

```go
handlers := []utils.HandlerInterface{
    dashboard.NewDashboardHandler(),
    olap.NewOlapHandler(),
    fields.NewFieldsHandler(),
    olapbody.NewOlapBodyHandler(),
    olappresets.NewOlapPresetsHandler(),
    // Ваш новый хэндлер
}

// Добавьте статические хендлеры для dashboard
handlers = append(handlers, dashboard.GetStaticHandlers()...)
```

## Лицензия

Proprietary
