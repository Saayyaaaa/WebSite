// main.js

// Инициализация карты Leaflet
function initMap() {
    const map = L.map('map').setView([43.2389, 76.8897], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker([43.2389, 76.8897])
      .addTo(map)
      .bindPopup('<b>Ритц Карлтон Алматы</b><br>Рейтинг: ★★★★★');
}

// Открытие/закрытие модальных окон
function openModal(id) {
    document.getElementById(id + "Modal").style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id + "Modal").style.display = "none";
}

// Обновление UI на основе авторизации
function updateAuthUI() {
    const authArea = document.getElementById("authArea");
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
        authArea.innerHTML = `
      <span style="color: black; margin-right: 1rem;">👤 ${user.login}</span>
      <button onclick="logout()">Выйти</button>
    `;
    } else {
        authArea.innerHTML = `
      <button onclick="openModal('register')"><i class="fas fa-user-plus"></i> Регистрация</button>
      <button onclick="openModal('login')"><i class="fas fa-sign-in-alt"></i> Войти</button>
    `;
    }
}

// Выход
function logout() {
    localStorage.removeItem("user");
    updateAuthUI();
}

// Переход на страницу оплаты
function goToPayment(id, title) {
    const params = new URLSearchParams({ hotelId: id, hotelTitle: title });
    window.location.href = `payment.html?${params.toString()}`;
}

// Переменная для хранения загруженных отелей
let hotelsData = [];

// Загрузка отелей с сервера
async function loadHotels() {
    try {
        const res = await fetch('/api/hotels');
        if (!res.ok) throw new Error('Ошибка загрузки: ' + res.status);
        return await res.json();
    } catch (err) {
        console.error(err);
        document.getElementById('hotels').innerHTML = '<p>Не удалось загрузить отели.</p>';
        return [];
    }
}

// Отрисовка списка отелей
function renderHotels(list) {
    const hotelGrid = document.getElementById('hotels');
    hotelGrid.innerHTML = '';

    if (list.length === 0) {
        hotelGrid.innerHTML = '<p>Ничего не найдено.</p>';
        return;
    }

    list.forEach(hotel => {
        const card = document.createElement('div');
        card.className = 'hotel-card';

        card.innerHTML = `
      <div class="hotel-image" style="background-image: url('${hotel.image}')"></div>
      <div class="hotel-info">
        <h3>${hotel.title}</h3>
        <div class="hotel-rating">${hotel.rating}</div>
        <p>${hotel.description}</p>
        <div class="hotel-price">${hotel.price}</div>
        <button class="book-button">Забронировать</button>
      </div>
    `;

        // Обработчик для кнопки бронирования
        const btn = card.querySelector('.book-button');
        btn.addEventListener('click', () => goToPayment(hotel.id, hotel.title));

        hotelGrid.appendChild(card);
    });
}

// Инициализация страницы после загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
    updateAuthUI();

    // Инициализируем карту
    initMap();

    // Загрузка и отрисовка отелей
    hotelsData = await loadHotels();
    renderHotels(hotelsData);

    // Поиск по названию
    const form = document.getElementById('filterForm');
    const nameInput = document.getElementById('searchName');
    form.addEventListener('submit', e => {
        e.preventDefault();
        const q = nameInput.value.trim().toLowerCase();
        const filtered = hotelsData.filter(h => h.title.toLowerCase().includes(q));
        renderHotels(filtered);
    });
});

// Регистрация
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const login = document.getElementById("regLogin").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("regConfirm").value;

    if (!name || !login || !password || !confirm) {
        alert("Пожалуйста, заполните все поля.");
        return;
    }
    if (password !== confirm) {
        alert("Пароли не совпадают!");
        return;
    }

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, login, password }),
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            document.getElementById("registerForm").reset();
            closeModal("register");
        } else {
            alert(data.message || "Ошибка регистрации");
        }
    } catch (err) {
        alert("Ошибка подключения к серверу");
        console.error(err);
    }
});

// Вход
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const login = document.getElementById("loginLogin").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!login || !password) {
        alert("Введите логин и пароль");
        return;
    }

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login, password }),
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("user", JSON.stringify(data.user));
            alert(data.message);
            document.getElementById("loginForm").reset();
            closeModal("login");
            updateAuthUI();
        } else {
            alert(data.message || "Ошибка входа");
        }
    } catch (err) {
        alert("Ошибка подключения к серверу");
        console.error(err);
    }
});