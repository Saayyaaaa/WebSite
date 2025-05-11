// server.js
import express     from "express";
import sqlite3     from "sqlite3";
import bodyParser  from "body-parser";
import cors        from "cors";
import path        from "path";
import { fileURLToPath } from "url";

/* ───── системные пути ───── */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/* ───── инициализация ───── */
const app  = express();
const PORT = 3000;
const db   = new sqlite3.Database(
  path.join(__dirname, "db.sqlite"),
  err => err && console.error("Ошибка при подключении к базе", err)
);

/* ───── мидлвары ───── */
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

/* ───── сид отелей (один раз) ───── */
const initialHotels = [
  { title: '"Ритц Карлтон" Алматы', description: 'Роскошный 5-звездочный отель в центре города', price: '₸ 45 000 / ночь', rating: '★★★★★', image: 'https://source.unsplash.com/800x600/?luxury,hotel' },
  { title: 'Отель "Казахстан"',   description: 'Популярный отель с прекрасным видом на горы',       price: '₸ 30 000 / ночь', rating: '★★★★',  image: 'https://source.unsplash.com/800x600/?building,hotel' },
  { title: '"Holiday Inn Express"',description: 'Современный отель с завтраком включённым',        price: '₸ 25 000 / ночь', rating: '★★★',   image: 'https://source.unsplash.com/800x600/?holiday-inn,hotel' }
];

/* ───── таблицы ───── */
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, login TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'user')`);
  db.run(`CREATE TABLE IF NOT EXISTS hotels(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT, description TEXT, price TEXT,
            rating TEXT, image TEXT)`);

  /* сидим отели один раз */
  db.get(`SELECT COUNT(*) AS cnt FROM hotels`, (err, row) => {
    if (err) return console.error(err);
    if (row.cnt === 0) {
      const stmt = db.prepare(`INSERT INTO hotels(title,description,price,rating,image) VALUES(?,?,?,?,?)`);
      initialHotels.forEach(h => stmt.run(h.title, h.description, h.price, h.rating, h.image));
      stmt.finalize();
      console.log(`🌱  Вставлено ${initialHotels.length} отелей`);
    }
  });

  /* создаём админа, если нет */
  db.get(`SELECT * FROM users WHERE login='admin'`, (err, user) => {
    if (!user)
      db.run(`INSERT INTO users(name,login,password,role) VALUES('Админ','admin','admin','admin')`);
  });
});

/* ───── вспом. функция ───── */
const isAdmin = (login, cb) => {
  db.get(`SELECT role FROM users WHERE login = ?`, [login], (e, u) =>
    cb(e, u && u.role === 'admin'));
};

/* ───── REST ───── */

/* все отели */
app.get('/api/hotels', (_,res) =>
  db.all(`SELECT * FROM hotels`, [], (e,rows)=>
    e ? res.status(500).json({message:'Ошибка БД'}) : res.json(rows)));

/* добавить */
app.post('/api/hotels', (req,res) => {
  const { login, title, description, price, rating, image } = req.body;
  isAdmin(login, (e, ok) => {
    if (e) return res.status(500).json({message:'Ошибка БД'});
    if (!ok) return res.status(403).json({message:'Доступ запрещён'});
    db.run(`INSERT INTO hotels(title,description,price,rating,image)
            VALUES(?,?,?,?,?)`,
      [title,description,price,rating,image],
      function(err){
        if (err) return res.status(500).json({message:'Ошибка добавления'});
        res.json({ message:'Отель добавлен', id:this.lastID });
      });
  });
});

/* редактировать */
app.put('/api/hotels/:id', (req,res)=>{
  const { login, title, description, price, rating, image } = req.body;
  const id = req.params.id;
  isAdmin(login, (e, ok) => {
    if (e)  return res.status(500).json({message:'Ошибка БД'});
    if (!ok) return res.status(403).json({message:'Доступ запрещён'});
    db.run(`UPDATE hotels
              SET title=?, description=?, price=?, rating=?, image=?
            WHERE id=?`,
      [title,description,price,rating,image,id],
      err => err
        ? res.status(500).json({message:'Ошибка обновления'})
        : res.json({message:'Отель обновлён'}));
  });
});

/* удалить */
app.delete('/api/hotels/:id', (req,res)=>{
  const { login } = req.body; const id = req.params.id;
  isAdmin(login, (e, ok)=>{
    if (e)  return res.status(500).json({message:'Ошибка БД'});
    if (!ok) return res.status(403).json({message:'Доступ запрещён'});
    db.run(`DELETE FROM hotels WHERE id=?`, [id],
      err => err
        ? res.status(500).json({message:'Ошибка удаления'})
        : res.json({message:'Отель удалён'}));
  });
});

/* регистрация */
app.post('/api/register', (req,res)=>{
  const { name,login,password } = req.body;
  const role = login==='admin' ? 'admin':'user';
  db.run(`INSERT INTO users(name,login,password,role) VALUES(?,?,?,?)`,
    [name,login,password,role],
    err=> err
      ? res.status(400).json({message:'Логин уже используется'})
      : res.status(201).json({message:'Пользователь зарегистрирован'}));
});

/* вход */
app.post('/api/login', (req,res)=>{
  const {login,password} = req.body;
  db.get(`SELECT name,login,role FROM users WHERE login=? AND password=?`,
    [login,password],
    (e,u)=> e ? res.status(500).json({message:'Ошибка БД'})
      : u ? res.json({message:'Успешный вход',user:u})
        : res.status(401).json({message:'Неверный логин или пароль'}));
});

/* ───── старт ───── */
app.listen(PORT, ()=>console.log(`✅  http://localhost:${PORT}`));
