Simple Shop — Express + PostgreSQL (Auth + Products CRUD)

Учебный проект: регистрация/логин (JWT) + CRUD продуктов.
Фронт лежит в public/ и раздаётся Express через express.static("public"), поэтому CORS не нужен.

Что умеет проект

Регистрация пользователя

Вход и получение JWT-токена

Получение профиля me

CRUD продуктов только текущего пользователя

updated_at обновляется через trigger в PostgreSQL

1) Требования (что поставить заранее)
1.1 Node.js

Установить Node.js LTS (подойдёт 18+ / 20+)

Проверить:

node -v
npm -v

1.2 PostgreSQL

Установить PostgreSQL 14+ (можно 15/16)

Запомнить:

host: localhost

port: 5432

user: postgres

password: (ваш пароль)

2) Структура проекта

Правильная структура (важно не смешивать front/back в одном файле):

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

Почему так важно

Всё, что в public/ — выполняется в браузере (там нельзя require, module.exports, express).

Всё, что в routes/ — выполняется в Node.js (сервер).

3) Установка библиотек

В папке проекта:

npm init -y
npm i express pg bcrypt jsonwebtoken


Если хочешь авто-перезапуск (не обязательно):

npm i -D nodemon


Зависимости проекта:

express — сервер и роуты

pg — подключение к PostgreSQL

bcrypt — хэширование пароля

jsonwebtoken — JWT токены

4) Настройка PostgreSQL (создание базы и таблиц)
4.1 Создать базу данных

В pgAdmin или через SQL:

CREATE DATABASE testdb;

4.2 Подключиться к testdb и выполнить SQL-скрипт

Важно: CREATE EXTENSION citext требует прав. Если не получается — можно убрать citext и сделать email TEXT.

-- (по желанию) расширение для регистронезависимого email
CREATE EXTENSION IF NOT EXISTS citext;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- триггер чтобы updated_at обновлялся сам
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

4.3 Частые ошибки в БД

Ошибка про триггер “не существует, пропускается”
Это нормально: DROP TRIGGER IF EXISTS просто сообщает, что удалять нечего, и дальше создаёт триггер.

Ошибка с citext
Если CREATE EXTENSION citext не запускается — убери citext и создай таблицу так:

email TEXT UNIQUE NOT NULL

5) Подключение к базе (db.js)

Файл db.js (в корне проекта):

const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "123",      // поставь свой пароль
  host: "localhost",
  port: 5432,
  database: "testdb",
});

module.exports = pool;

6) Сервер (index.js)

Файл index.js (в корне проекта):

const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

const usersRoutes = require("./routes/users.routes");
const productsRoutes = require("./routes/products.routes");

app.use("/api/users", usersRoutes);
app.use("/api/products", productsRoutes);

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});

7) Роуты пользователей (routes/users.routes.js)

В этом файле:

регистрация

логин (JWT)

/me (проверка токена)

middleware auth экспортируется для products

Ключевые моменты:

Пароль хранится только хэшем

JWT токен передаётся в заголовке:
Authorization: Bearer <token>

В реальном проекте секрет (JWT_SECRET) хранят в .env, но здесь он захардкожен для учебного проекта.

8) Роуты продуктов (routes/products.routes.js)

В этом файле:

GET /api/products — список только своих продуктов

POST /api/products — создать продукт с owner_id текущего юзера

PUT /api/products/:id — обновление только своего продукта

DELETE /api/products/:id — удаление только своего продукта

Везде используется auth, чтобы без токена продукты не получить.

9) Фронт (public/)
9.1 Важно: подключение файлов в index.html

В конце public/index.html:

<script src="auth.js"></script>
<script src="products.api.js"></script>
<script src="script.js"></script>


Порядок критически важен:

auth.js создаёт window.API и getToken()

products.api.js использует getToken()

script.js вызывает функции getProducts/createProduct/...

9.2 API адрес

Фронт работает через:

window.API = window.API || "/api";


Это значит, что запросы идут на тот же домен, что и сайт (например http://localhost:3000/api/...).

10) Запуск проекта
10.1 Запуск сервера
node index.js


Ожидаемый вывод:

Server started on http://localhost:3000


Открыть:

http://localhost:3000

11) Быстрые проверки API (для отладки)
Регистрация

POST /api/users/register

{
  "email": "a@a.com",
  "password": "1234",
  "name": "Alex"
}

Логин

POST /api/users/login

{
  "email": "a@a.com",
  "password": "1234"
}


Ответ вернёт token.

Профиль

GET /api/users/me
Header:

Authorization: Bearer <token>

Продукты

GET /api/products

POST /api/products

PUT /api/products/:id

DELETE /api/products/:id

Header везде:

Authorization: Bearer <token>

12) Частые проблемы и решения
12.1 getProducts is not defined / createProduct is not defined

Причина: файлы подключены не в том порядке или смешаны в один файл.

Проверь:

auth.js, products.api.js, script.js — три отдельных файла

порядок <script> в index.html как в разделе 9.1

12.2 pool.query is not a function

Причина: неправильный экспорт db.js.

Правильно:

module.exports = pool;


И импорт:

const pool = require("../db");

12.3 Ошибка 500 при register/login

Смотри терминал, где запущен node — там будет реальный stack trace.
Чаще всего: таблицы не созданы или не та база в db.js.
