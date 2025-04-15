// Открытие/закрытие модальных окон
function openModal(id) {
    document.getElementById(id + 'Modal').style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id + 'Modal').style.display = 'none';
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

// Переход на страницу отеля
function viewHotel(id) {
    window.location.href = `hotel.html?id=${id}`;
}

// Отрисовка списка отелей на главной
function renderHotels() {
    const hotelGrid = document.querySelector(".hotel-grid");
    if (!hotelGrid || !window.hotelData) return;

    hotelGrid.innerHTML = "";

    Object.values(window.hotelData).forEach(hotel => {
        const card = document.createElement("div");
        card.className = "hotel-card";
        card.setAttribute("onclick", `viewHotel('${hotel.id}')`);

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
        hotelGrid.appendChild(card);
    });
}

// Запуск при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    updateAuthUI();
    renderHotels(); // отели из hotels.js
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
