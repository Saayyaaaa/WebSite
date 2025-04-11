document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("filterForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const nameFilter = document.getElementById("searchName").value.toLowerCase().trim();
        const guestFilter = document.getElementById("guestCount").value;

        const hotelCards = document.querySelectorAll(".hotel-card");

        hotelCards.forEach(card => {
            const hotelName = card.dataset.name.toLowerCase();
            const hotelGuests = parseInt(card.dataset.guests);

            const matchesName = hotelName.includes(nameFilter);
            const matchesGuests = !guestFilter || hotelGuests >= parseInt(guestFilter);

            card.style.display = (matchesName && matchesGuests) ? "block" : "none";
        });
    });
});
