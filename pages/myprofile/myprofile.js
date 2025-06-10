document.addEventListener("DOMContentLoaded", function() {
  const closeButton = document.querySelector(".close");
  
  closeButton.addEventListener("click", function() {
    window.location.href = "/pages/search/search.html";
  });
  
  // Можно добавить другие обработчики для элементов меню
});