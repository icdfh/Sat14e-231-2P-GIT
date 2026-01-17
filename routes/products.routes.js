const express = require("express");
const pool = require("../db");
const usersRoutes = require("./users.routes");

const router = express.Router();
const auth = usersRoutes.auth;

// GET /api/products  (только продукты текущего юзера)
router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, price, owner_id, created_at, updated_at
       FROM products
       WHERE owner_id=$1
       ORDER BY id DESC`,
      [req.user.id]
    );
    return res.json({ products: result.rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// GET /api/products/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "id некорректный" });

    const result = await pool.query(
      `SELECT id, title, description, price, owner_id, created_at, updated_at
       FROM products
       WHERE id=$1 AND owner_id=$2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Не найдено" });
    return res.json({ product: result.rows[0] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// POST /api/products
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, price } = req.body;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ message: "title обязателен" });
    }

    const p = Number(price);
    if (!Number.isFinite(p) || p < 0) {
      return res.status(400).json({ message: "price должен быть числом >= 0" });
    }

    const created = await pool.query(
      `INSERT INTO products (title, description, price, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, price, owner_id, created_at, updated_at`,
      [title, description || "", p, req.user.id]
    );

    return res.status(201).json({ product: created.rows[0] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// PUT /api/products/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "id некорректный" });

    const { title, description, price } = req.body;

    const p = Number(price);
    if (!title || !Number.isFinite(p) || p < 0) {
      return res.status(400).json({ message: "Нужно: title (string) и price (number>=0)" });
    }

    const updated = await pool.query(
      `UPDATE products
       SET title=$1, description=$2, price=$3
       WHERE id=$4 AND owner_id=$5
       RETURNING id, title, description, price, owner_id, created_at, updated_at`,
      [title, description || "", p, id, req.user.id]
    );

    if (updated.rows.length === 0) return res.status(404).json({ message: "Не найдено" });
    return res.json({ product: updated.rows[0] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// DELETE /api/products/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "id некорректный" });

    const del = await pool.query(
      `DELETE FROM products
       WHERE id=$1 AND owner_id=$2
       RETURNING id`,
      [id, req.user.id]
    );

    if (del.rows.length === 0) return res.status(404).json({ message: "Не найдено" });
    return res.json({ deletedId: del.rows[0].id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;
