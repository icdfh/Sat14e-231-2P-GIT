const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

// ВАЖНО: в реальном проекте держи в .env
const JWT_SECRET = "super_secret_change_me";
const JWT_EXPIRES_IN = "7d";

// middleware: проверка токена
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Нет токена (Bearer)" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email }
    next();
  } catch (e) {
    return res.status(401).json({ message: "Токен неверный или истёк" });
  }
}

// POST /api/users/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "email, password, name обязательны" });
    }

    if (password.length < 4) {
      return res.status(400).json({ message: "Пароль слишком короткий (мин 4)" });
    }

    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "Пользователь с таким email уже существует" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const created = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email, password_hash, name]
    );

    return res.status(201).json({ user: created.rows[0] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// POST /api/users/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email и password обязательны" });
    }

    const found = await pool.query(
      "SELECT id, email, name, password_hash FROM users WHERE email=$1",
      [email]
    );

    if (found.rows.length === 0) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }

    const user = found.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// GET /api/users/me
router.get("/me", auth, async (req, res) => {
  try {
    const me = await pool.query(
      "SELECT id, email, name, created_at FROM users WHERE id=$1",
      [req.user.id]
    );

    if (me.rows.length === 0) return res.status(404).json({ message: "Не найден" });
    return res.json({ user: me.rows[0] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;
module.exports.auth = auth; // экспорт auth, чтобы использовать в products
