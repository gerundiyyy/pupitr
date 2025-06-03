const priceMinInput = document.getElementById("priceMinInput");
const priceMaxInput = document.getElementById("priceMaxInput");
const priceMinSlider = document.getElementById("priceMin");
const priceMaxSlider = document.getElementById("priceMax");
const priceRange = document.querySelector(".priceRange");

// Обновляет значение ползунка, когда вводят число
priceMinInput.addEventListener("input", () => {
    priceMinSlider.value = priceMinInput.value;
    updatePriceRange();
});

priceMaxInput.addEventListener("input", () => {
    priceMaxSlider.value = priceMaxInput.value;
    updatePriceRange();
});

// Обновляет текст диапазона цен
function updatePriceRange() {
    priceRange.textContent = `${priceMinSlider.value} - ${priceMaxSlider.value} руб`;
}

// Обновляет поля ввода при изменении ползунков
priceMinSlider.addEventListener("input", () => {
    priceMinInput.value = priceMinSlider.value;
    updatePriceRange();
});

priceMaxSlider.addEventListener("input", () => {
    priceMaxInput.value = priceMaxSlider.value;
    updatePriceRange();
});
