document.getElementById('searchBtn').addEventListener('click', function () {
    const query = document.getElementById('searchBox').value.toLowerCase();
    const studioCards = document.querySelectorAll('.studio-card');

    studioCards.forEach(card => {
        const studioName = card.getAttribute('data-name').toLowerCase();
        card.style.display = studioName.includes(query) ? 'block' : 'none';
    });
});

document.getElementById('cityFilter').addEventListener('change', function () {
    const selectedCity = this.value;
    const studioCards = document.querySelectorAll('.studio-card');

    studioCards.forEach(card => {
        const studioCity = card.getAttribute('data-city');
        card.style.display = selectedCity === "" || selectedCity === studioCity ? 'block' : 'none';
    });
});

document.getElementById('priceFilter').addEventListener('input', function () {
    const maxPrice = this.value;
    const studioCards = document.querySelectorAll('.studio-card');

    studioCards.forEach(card => {
        const studioPrice = parseInt(card.getAttribute('data-price'), 10);
        card.style.display = maxPrice === "" || studioPrice <= maxPrice ? 'block' : 'none';
    });
});

function goToStudioPage(studioName) {
    window.location.href = `${studioName}.html`;
}
