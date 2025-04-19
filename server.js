import express from "express";
import sqlite3 from "sqlite3";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Аналог __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Инициализация сервера и базы
const app = express();
const PORT = 3000;
const db = new sqlite3.Database("./db.sqlite");

// Мидлвары
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Создание таблицы с ролью
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        login TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user'
    )
`);

// 2. Создадим таблицу отелей
db.run(`
  CREATE TABLE IF NOT EXISTS hotels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price TEXT NOT NULL,
    rating TEXT NOT NULL,
    image TEXT NOT NULL
  )
`);


// 3. Добавим пользователя admin по умолчанию
db.get(`SELECT * FROM users WHERE login = ?`, ["admin"], (err, user) => {
  if (!user) {
    db.run(
      `INSERT INTO users (name, login, password, role) VALUES (?, ?, ?, ?)`,
      ["Админ", "admin", "admin", "admin"]
    );
  }
});


// 4. Эндпоинты для добавления и удаления отелей (только для админа)
app.post("/api/hotels", (req, res) => {
  const { title, description, price, rating, image, login } = req.body;

  db.get("SELECT * FROM users WHERE login = ?", [login], (err, user) => {
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Доступ запрещён" });
    }

    db.run(
      `INSERT INTO hotels (title, description, price, rating, image) VALUES (?, ?, ?, ?, ?)`,
      [title, description, price, rating, image],
      function (err) {
        if (err) return res.status(500).json({ message: "Ошибка добавления" });
        res.json({ message: "Отель добавлен", id: this.lastID });
      }
    );
  });
});

app.delete("/api/hotels/:id", (req, res) => {
  const { login } = req.body;
  const id = req.params.id;

  db.get("SELECT * FROM users WHERE login = ?", [login], (err, user) => {
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Доступ запрещён" });
    }

    db.run(`DELETE FROM hotels WHERE id = ?`, [id], function (err) {
      if (err) return res.status(500).json({ message: "Ошибка удаления" });
      res.json({ message: "Отель удалён" });
    });
  });
});

// 🚀 Регистрация
app.post("/api/register", (req, res) => {
    const { name, login, password } = req.body;
    const role = login === "admin" ? "admin" : "user"; // Пример: логин admin получает роль admin

    db.run(
      `INSERT INTO users (name, login, password, role) VALUES (?, ?, ?, ?)`,
      [name, login, password, role],
      function (err) {
          if (err) {
              return res.status(400).json({ message: "Логин уже используется." });
          }
          res.status(201).json({ message: "Пользователь зарегистрирован!" });
      }
    );
});

// 🔐 Вход
app.post("/api/login", (req, res) => {
    const { login, password } = req.body;

    db.get(
      `SELECT name, login, role FROM users WHERE login = ? AND password = ?`,
      [login, password],
      (err, user) => {
          if (user) {
              res.json({ message: "Успешный вход", user });
          } else {
              res.status(401).json({ message: "Неверный логин или пароль" });
          }
      }
    );
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
