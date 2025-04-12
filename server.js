import express from "express";
import sqlite3 from "sqlite3";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// для __dirname аналога
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// инициализация
const app = express();
const PORT = 3000;

const db = new sqlite3.Database("./db.sqlite");

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Создание таблицы
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  login TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
)`);

// Регистрация
app.post("/api/register", (req, res) => {
    const { name, login, password } = req.body;

    db.run(
        `INSERT INTO users (name, login, password) VALUES (?, ?, ?)`,
        [name, login, password],
        function (err) {
            if (err) {
                return res.status(400).json({ message: "Логин уже используется." });
            }
            res.status(201).json({ message: "Пользователь зарегистрирован!" });
        }
    );
});

// Вход
app.post("/api/login", (req, res) => {
    const { login, password } = req.body;

    db.get(`SELECT * FROM users WHERE login = ? AND password = ?`, [login, password], (err, user) => {
        if (user) {
            res.json({ message: "Успешный вход", user });
        } else {
            res.status(401).json({ message: "Неверный логин или пароль" });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});