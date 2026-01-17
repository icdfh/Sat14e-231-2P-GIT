# Simple Shop — Express + PostgreSQL (Auth + Products CRUD)

Учебный проект: регистрация/логин (JWT) + CRUD продуктов.  
Фронт лежит в `public/` и раздаётся Express через `express.static("public")`, поэтому CORS не нужен.

---

## Скриншоты

<img width="1920" height="955" alt="image" src="https://github.com/user-attachments/assets/4133f732-9cc2-4084-89c8-7842c01eb2a7" />

![Uploading image.png…]()


---

## Возможности

- Регистрация пользователя
- Вход и получение JWT-токена
- Профиль текущего пользователя (`/me`)
- CRUD продуктов (только свои продукты)
- `updated_at` обновляется автоматически (PostgreSQL trigger)

---

## Стек

- **Backend:** Node.js, Express
- **DB:** PostgreSQL
- **Auth:** JWT (`jsonwebtoken`), пароль через `bcrypt`
- **Frontend:** HTML / CSS / JS (без фреймворков)

---

## Структура проекта

```txt
project/
  index.js
  db.js
  package.json
  routes/
    users.routes.js
    products.routes.js
  public/
    index.html
    styles.css
    auth.js
    products.api.js
    script.js
  assets/
    screen-1.png
    screen-2.png
Установка и запуск
1) Установить зависимости
bash
Копировать код
npm i
Если репо пустое и ты собираешь с нуля:

bash
Копировать код
npm init -y
npm i express pg bcrypt jsonwebtoken
2) PostgreSQL: база и таблицы
Создай базу:

sql
Копировать код
CREATE DATABASE testdb;
Подключись к testdb и выполни:

sql
Копировать код
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
Если citext не создаётся (нет прав) — замени email CITEXT на email TEXT.

3) Настройка подключения к базе (db.js)
Открой db.js и проверь данные:

js
Копировать код
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "123", // твой пароль
  host: "localhost",
  port: 5432,
  database: "testdb",
});

module.exports = pool;
4) Запуск сервера
bash
Копировать код
node index.js
Открой:

http://localhost:3000

API (эндпоинты)
Auth
POST /api/users/register

POST /api/users/login

GET /api/users/me (нужен токен)

Products (нужен токен)
GET /api/products

POST /api/products

PUT /api/products/:id

DELETE /api/products/:id

Примеры запросов
Регистрация
POST /api/users/register

json
Копировать код
{
  "email": "a@a.com",
  "password": "1234",
  "name": "Alex"
}
Логин
POST /api/users/login

json
Копировать код
{
  "email": "a@a.com",
  "password": "1234"
}
Ответ содержит token. Его нужно передавать так:

makefile
Копировать код
Authorization: Bearer <token>
Частые ошибки
getProducts is not defined / createProduct is not defined
Причина: неверный порядок подключения JS.

В public/index.html должно быть:

html
Копировать код
<script src="auth.js"></script>
<script src="products.api.js"></script>
<script src="script.js"></script>
pool.query is not a function
Причина: неправильный экспорт из db.js.

Должно быть:

js
Копировать код
module.exports = pool;
