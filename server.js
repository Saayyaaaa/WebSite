import express from "express";
import sqlite3 from "sqlite3";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Аналог __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Инициализация сервера и базы данных
const app = express();
const PORT = 3000;
const db = new sqlite3.Database(path.join(__dirname, "db.sqlite"), err => {
  if (err) console.error("Ошибка при подключении к базе", err);
});

// Мидлвары
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Сид начальных данных в таблицу hotels
const initialHotels = [
  { title: '"Ритц Карлтон" Алматы', description: 'Роскошный 5-звездочный отель в центре города', price: '₸ 45 000 / ночь', rating: '★★★★★', image: 'https://source.unsplash.com/800x600/?luxury,hotel' },
  { title: 'Отель "Казахстан"', description: 'Популярный отель с прекрасным видом на горы', price: '₸ 30 000 / ночь', rating: '★★★★', image: 'https://source.unsplash.com/800x600/?building,hotel' },
  { title: '"Holiday Inn Express"', description: 'Современный отель с комфортными номерами и завтраком включённым', price: '₸ 25 000 / ночь', rating: '★★★', image: 'https://source.unsplash.com/800x600/?holiday-inn,hotel' },
  { title: 'Renion Park Hotel', description: 'Уютный отель рядом с парком 28 панфиловцев', price: '₸ 20 000 / ночь', rating: '★★★', image: 'https://source.unsplash.com/800x600/?park,hotel' },
  { title: '"InterContinental" Алматы', description: 'Высококлассный отель с бассейном, SPA и ресторанами', price: '₸ 55 000 / ночь', rating: '★★★★★', image: 'https://source.unsplash.com/800x600/?luxury,hotel' },
  { title: 'Novotel Алматы', description: 'Комфортабельный отель для деловых поездок и отдыха', price: '₸ 28 000 / ночь', rating: '★★★★', image: 'https://source.unsplash.com/800x600/?novotel,hotel' },
  { title: 'Sheraton Алматы', description: 'Современный отель с отличным спа и фитнес-центром', price: '₸ 40 000 / ночь', rating: '★★★★☆', image: 'https://source.unsplash.com/800x600/?sheraton,hotel' },
  { title: 'Grand Hotel Tien Shan', description: 'Элегантный отель с европейским интерьером и рестораном', price: '₸ 27 000 / ночь', rating: '★★★☆', image: 'https://source.unsplash.com/800x600/?classic,hotel' },
  { title: 'Domina Hotel', description: 'Уютный бутик-отель с индивидуальным дизайном', price: '₸ 22 000 / ночь', rating: '★★★', image: 'https://source.unsplash.com/800x600/?boutique,hotel' },
  { title: 'Almaty Inn Hotel', description: 'Бюджетный вариант рядом с метро и остановками', price: '₸ 18 000 / ночь', rating: '★★', image: 'https://source.unsplash.com/800x600/?building' },
  { title: '"Домик в горах"', description: 'Уютный домик на окраине города с камином и видом на природу', price: '₸ 18 000 / ночь', rating: '★★★', image: 'https://source.unsplash.com/800x600/?cabin,mountain' },
  { title: 'Almaty "Backpackers Hostel"', description: 'Экономичный хостел для путешественников с душой', price: '₸ 8 000 / ночь', rating: '★★', image: 'https://source.unsplash.com/800x600/?hostel,room' }
];

// Создание таблицы users
db.run(
  `CREATE TABLE IF NOT EXISTS users (
                                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                                        name TEXT NOT NULL,
                                        login TEXT UNIQUE NOT NULL,
                                        password TEXT NOT NULL,
                                        role TEXT DEFAULT 'user'
   )`
);

// Создание таблицы hotels и сид данных
db.run(
  `CREATE TABLE IF NOT EXISTS hotels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price TEXT NOT NULL,
    rating TEXT NOT NULL,
    image TEXT NOT NULL
  )`,
  err => {
    if (err) return console.error('Ошибка создания таблицы hotels:', err);
    db.get(`SELECT COUNT(*) AS cnt FROM hotels`, (err, row) => {
      if (err) return console.error(err);
      if (row.cnt === 0) {
        const stmt = db.prepare(`INSERT INTO hotels (title, description, price, rating, image) VALUES (?, ?, ?, ?, ?)`);
        initialHotels.forEach(h => stmt.run(h.title, h.description, h.price, h.rating, h.image));
        stmt.finalize();
        console.log(`🌱 Вставлено ${initialHotels.length} отелей`);
      }
    });
  }
);

// Добавить админа, если нет
db.get(`SELECT * FROM users WHERE login = ?`, ['admin'], (err, user) => {
  if (err) return console.error(err);
  if (!user) {
    db.run(
      `INSERT INTO users (name, login, password, role) VALUES (?, ?, ?, ?)`,
      ['Админ', 'admin', 'admin', 'admin'],
      err => err && console.error(err)
    );
  }
});

// Эндпоинт: получить все отели
app.get('/api/hotels', (req, res) => {
  db.all(
    'SELECT id, title, description, price, rating, image FROM hotels',
    [],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Ошибка БД' });
      }
      res.json(rows);
    }
  );
});

// Эндпоинт: получить всех пользователей
app.get('/api/users', (req, res) => {
  db.all(
    'SELECT id, name, login, role FROM users',
    [],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Ошибка БД' });
      }
      res.json(rows);
    }
  );
});

// Эндпоинты для добавления и удаления отелей (только админ)
app.post('/api/hotels', (req, res) => {
  const { title, description, price, rating, image, login } = req.body;
  db.get('SELECT * FROM users WHERE login = ?', [login], (err, user) => {
    if (err) return res.status(500).json({ message: 'Ошибка БД' });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }
    db.run(
      'INSERT INTO hotels (title, description, price, rating, image) VALUES (?, ?, ?, ?, ?)',
      [title, description, price, rating, image],
      function(err) {
        if (err) return res.status(500).json({ message: 'Ошибка добавления' });
        res.json({ message: 'Отель добавлен', id: this.lastID });
      }
    );
  });
});

app.delete('/api/hotels/:id', (req, res) => {
  const { login } = req.body;
  const id = req.params.id;
  db.get('SELECT * FROM users WHERE login = ?', [login], (err, user) => {
    if (err) return res.status(500).json({ message: 'Ошибка БД' });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }
    db.run('DELETE FROM hotels WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ message: 'Ошибка удаления' });
      res.json({ message: 'Отель удалён' });
    });
  });
});

// Регистрация нового пользователя
app.post('/api/register', (req, res) => {
  const { name, login, password } = req.body;
  const role = login === 'admin' ? 'admin' : 'user';
  db.run(
    'INSERT INTO users (name, login, password, role) VALUES (?, ?, ?, ?)',
    [name, login, password, role],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(400).json({ message: 'Логин уже используется.' });
      }
      res.status(201).json({ message: 'Пользователь зарегистрирован!' });
    }
  );
});

// Вход пользователя
app.post('/api/login', (req, res) => {
  const { login, password } = req.body;
  db.get(
    'SELECT name, login, role FROM users WHERE login = ? AND password = ?',
    [login, password],
    (err, user) => {
      if (err) return res.status(500).json({ message: 'Ошибка БД' });
      if (!user) {
        return res.status(401).json({ message: 'Неверный логин или пароль' });
      }
      res.json({ message: 'Успешный вход', user });
    }
  );
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен: http://localhost:${PORT}`);
});
