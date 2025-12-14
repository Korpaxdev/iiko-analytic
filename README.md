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
- Веб-интерфейс для работы с API
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

**Особенности:**

- ETag кэширование
- Cache-Control: 1 час
- HTTP/2 Server Push для CDN

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
{
  "data": [
    {
      "DepartmentName": "Кухня",
      "DishCategory": "Горячие блюда",
      "UniqAmount.Profit": 15000.50,
      "DishDiscountSum": 1200.00
    },
    ...
  ]
}
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

## Архитектура

```
.
├── cmd/api/              # Entry point
├── internal/
│   ├── api/              # API слой
│   │   ├── routes/       # Роуты
│   │   │   ├── dashboard/
│   │   │   ├── fields/
│   │   │   └── olap/
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
    // Ваш новый хэндлер
}
```

## Лицензия

Proprietary
