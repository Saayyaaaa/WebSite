/* ----------  Leaflet карта  ---------- */
function initMap() {
    const map = L.map("map").setView([43.2389, 76.8897], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    L.marker([43.2389, 76.8897])
      .addTo(map)
      .bindPopup("<b>Ритц Карлтон Алматы</b><br>Рейтинг: ★★★★★");
}

/* ----------  Модалки  ---------- */
function openModal(id) {
    document.getElementById(id + "Modal").style.display = "flex";
}
function closeModal(id) {
    document.getElementById(id + "Modal").style.display = "none";
}

/* ----------  UI авторизации ─ шапка  ---------- */
function updateAuthUI() {
    const authArea = document.getElementById("authArea");
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
        authArea.innerHTML = `
      <span style="color:#000;margin-right:1rem;">👤 ${user.login}</span>
      <button onclick="logout()">Выйти</button>`;
    } else {
        authArea.innerHTML = `
      <button onclick="openModal('register')"><i class="fas fa-user-plus"></i> Регистрация</button>
      <button onclick="openModal('login')"><i class="fas fa-sign-in-alt"></i> Войти</button>`;
    }
}

/* ----------  Выход из аккаунта  ---------- */
function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

/* ----------  Переход к оплате  ---------- */
function goToPayment(id, title) {
    const params = new URLSearchParams({ hotelId: id, hotelTitle: title });
    window.location.href = `payment.html?${params.toString()}`;
}

/* ----------  Загрузка отелей с сервера  ---------- */
async function loadHotels() {
    try {
        const res = await fetch("/api/hotels");
        if (!res.ok) throw new Error("Ошибка загрузки: " + res.status);
        return await res.json();
    } catch (err) {
        console.error(err);
        document.getElementById("hotels").innerHTML =
          "<p>Не удалось загрузить отели.</p>";
        return [];
    }
}

/* ----------  Отрисовка карточек  ---------- */
function renderHotels(list) {
    const hotelGrid = document.getElementById("hotels");
    hotelGrid.innerHTML = "";

    if (list.length === 0) {
        hotelGrid.innerHTML = "<p>Ничего не найдено.</p>";
        return;
    }

    list.forEach((hotel) => {
        const card = document.createElement("div");
        card.className = "hotel-card";
        card.innerHTML = `
      <div class="hotel-image" style="background-image:url('${hotel.image}')"></div>
      <div class="hotel-info">
        <h3>${hotel.title}</h3>
        <div class="hotel-rating">${hotel.rating}</div>
        <p>${hotel.description}</p>
        <div class="hotel-price">${hotel.price}</div>
        <button class="book-button">Забронировать</button>
      </div>`;
        card
          .querySelector(".book-button")
          .addEventListener("click", () => goToPayment(hotel.id, hotel.title));
        hotelGrid.appendChild(card);
    });
}

/* ----------  Главная точка входа ---------- */
let hotelsData = [];
document.addEventListener("DOMContentLoaded", async () => {
    /* 🛡️ 1. Если админ открывает index.html → сразу на admin-панель */
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.role === "admin") {
        window.location.href = "admin-hotel.html";
        return; // не выполняем код ниже
    }

    /* 2. Для обычных пользователей продолжаем загрузку страницы */
    updateAuthUI();
    initMap();

    hotelsData = await loadHotels();
    renderHotels(hotelsData);

    /* 3. Фильтр по названию */
    const form = document.getElementById("filterForm");
    const nameInput = document.getElementById("searchName");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = nameInput.value.trim().toLowerCase();
        renderHotels(
          hotelsData.filter((h) => h.title.toLowerCase().includes(q))
        );
    });
});

/* ----------  Регистрация  ---------- */
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const login = document.getElementById("regLogin").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("regConfirm").value;

    if (!name || !login || !password || !confirm)
        return alert("Пожалуйста, заполните все поля.");
    if (password !== confirm) return alert("Пароли не совпадают!");

    try {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, login, password }),
        });
        const data = await res.json();
        if (res.ok) {
            alert(data.message);
            e.target.reset();
            closeModal("register");
        } else alert(data.message || "Ошибка регистрации");
    } catch {
        alert("Ошибка подключения к серверу");
    }
});

/* ----------  Вход  ---------- */
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const login = document.getElementById("loginLogin").value.trim();
    const password = document.getElementById("loginPassword").value;
    if (!login || !password) return alert("Введите логин и пароль");

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login, password }),
        });
        const data = await res.json();
        if (!res.ok) return alert(data.message || "Ошибка входа");

        /* сохраняем пользователя */
        localStorage.setItem("user", JSON.stringify(data.user));

        /* если админ → на панель, иначе просто обновляем шапку */
        if (data.user.role === "admin") {
            window.location.href = "admin-hotel.html";
            return;
        }

        alert(data.message);
        e.target.reset();
        closeModal("login");
        updateAuthUI();
    } catch {
        alert("Ошибка подключения к серверу");
    }
});