// Базовый URL API - нужно заменить на ваш реальный URL API
const API_BASE_URL = 'http://localhost:3000/api';

// Элементы DOM
const studioCardsContainer = document.querySelector('.studio-cards');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.querySelector('.search-btn');
const mapToggleBtn = document.querySelector('.map-toggle');
const clearFiltersBtn = document.querySelector('.clear-filters');
const sortSelect = document.querySelector('.sort-select');
const districtSelect = document.querySelector('.district-select');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const minPriceSlider = document.getElementById('minPriceSlider');
const maxPriceSlider = document.getElementById('maxPriceSlider');
const typeCheckboxes = document.querySelectorAll('input[name="type"]');
const servicesContainer = document.querySelector('.filter-options.services');
const amenitiesContainer = document.querySelector('.filter-options.amenities');


function showLoading() {
  studioCardsContainer.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Загрузка студий...</p>
    </div>
  `;
}

// Текущие фильтры
let currentFilters = {
  searchQuery: '',
  type: ['rehearsal', 'recording'],
  services: [],
  amenities: [],
  minPrice: 0,
  maxPrice: 10000,
  district: '',
  sort: 'popular',
  page: 1
};

// Все данные из БД
let allStudios = [];
let allDistricts = [];
let allAmenities = [];
let allServices = [];

// Инициализация приложения
async function init() {
  try {
    showLoading();
    await loadAllData();
    initFilters();
    setupEventListeners();
    applyFilters();
  } catch (error) {
    console.error('Ошибка инициализации:', error);
    showError('Не удалось загрузить данные. Пожалуйста, обновите страницу.');
  }
}

// Загрузка всех данных из API
async function loadAllData() {
  try {
    // Загружаем данные через те же эндпоинты, что и в первом файле
    const [studios, districts, amenities, services] = await Promise.all([
      fetch(`${API_BASE_URL}/studios`).then(res => res.json()),
      fetch(`${API_BASE_URL}/districts`).then(res => res.json()),
      fetch(`${API_BASE_URL}/amenities`).then(res => res.json()),
      fetch(`${API_BASE_URL}/services`).then(res => res.json())
    ]);
    
    allStudios = studios;
    allDistricts = districts;
    allAmenities = amenities.map(a => a.value);
    allServices = services.map(s => s.value);
    
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    throw error;
  }
}

// Инициализация фильтров
function initFilters() {
  // Заполняем районы
  districtSelect.innerHTML = '<option value="">Все районы</option>';
  allDistricts.forEach(district => {
    const option = document.createElement('option');
    option.value = district.value;
    option.textContent = district.label;
    districtSelect.appendChild(option);
  });
  
  // Заполняем удобства
  amenitiesContainer.innerHTML = '';
  allAmenities.forEach(amenity => {
    const label = document.createElement('label');
    label.className = 'filter-checkbox';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'amenity';
    input.value = amenity;
    
    label.appendChild(input);
    label.append(document.createTextNode(amenity));
    amenitiesContainer.appendChild(label);
  });

  // Заполняем услуги
  servicesContainer.innerHTML = '';
  allServices.forEach(service => {
    const label = document.createElement('label');
    label.className = 'filter-checkbox';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'service';
    input.value = service;
    
    label.appendChild(input);
    label.append(document.createTextNode(service));
    servicesContainer.appendChild(label);
  });
}

// Настройка обработчиков событий
function setupEventListeners() {
  // Поиск
  searchInput.addEventListener('input', debounce(() => {
    currentFilters.searchQuery = searchInput.value.trim();
    currentFilters.page = 1;
    applyFilters();
  }, 300));

  searchBtn.addEventListener('click', () => {
    currentFilters.searchQuery = searchInput.value.trim();
    currentFilters.page = 1;
    applyFilters();
  });

  // Переключение на карту
  mapToggleBtn.addEventListener('click', () => {
    alert('Функция "Показать на карте" будет реализована в будущем обновлении!');
  });

  // Сброс фильтров
  clearFiltersBtn.addEventListener('click', resetFilters);

  // Фильтры по типу
  typeCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updateTypeFilters);
  });

  // Фильтры по услугам и удобствам
  document.addEventListener('change', function(e) {
    if (e.target.name === 'amenity') {
      currentFilters.amenities = Array.from(document.querySelectorAll('input[name="amenity"]:checked'))
        .map(checkbox => checkbox.value);
      applyFilters();
    }
    if (e.target.name === 'service') {
      currentFilters.services = Array.from(document.querySelectorAll('input[name="service"]:checked'))
        .map(checkbox => checkbox.value);
      applyFilters();
    }
  });

  // Сортировка
  sortSelect.addEventListener('change', function() {
    currentFilters.sort = this.value;
    applyFilters();
  });

  // Район
  districtSelect.addEventListener('change', function() {
    currentFilters.district = this.value;
    applyFilters();
  });

  // Ценовой диапазон
  minPriceInput.addEventListener('input', () => {
    const value = Math.min(parseInt(minPriceInput.value) || 0, parseInt(maxPriceInput.value) || 10000);
    minPriceInput.value = value;
    minPriceSlider.value = value;
    currentFilters.minPrice = value;
    applyFilters();
  });

  maxPriceInput.addEventListener('input', () => {
    const value = Math.max(parseInt(maxPriceInput.value) || 10000, parseInt(minPriceInput.value) || 0);
    maxPriceInput.value = value;
    maxPriceSlider.value = value;
    currentFilters.maxPrice = value;
    applyFilters();
  });

  minPriceSlider.addEventListener('input', () => {
    const value = Math.min(parseInt(minPriceSlider.value), parseInt(maxPriceSlider.value));
    minPriceInput.value = value;
    minPriceSlider.value = value;
    currentFilters.minPrice = value;
    applyFilters();
  });

  maxPriceSlider.addEventListener('input', () => {
    const value = Math.max(parseInt(maxPriceSlider.value), parseInt(minPriceSlider.value));
    maxPriceInput.value = value;
    maxPriceSlider.value = value;
    currentFilters.maxPrice = value;
    applyFilters();
  });
}

// Обновление фильтров по типу студии
function updateTypeFilters() {
  const selectedTypes = [];
  document.querySelectorAll('input[name="type"]:checked').forEach(checkbox => {
    selectedTypes.push(checkbox.value);
  });
  currentFilters.type = selectedTypes;
  applyFilters();
}

// Применение фильтров
function applyFilters() {
  try {
    showLoading();
    
    // Фильтрация студий
    let filteredStudios = [...allStudios];
    
    // Поиск по названию, описанию и адресу
    if (currentFilters.searchQuery) {
      const searchTerm = currentFilters.searchQuery.toLowerCase();
      filteredStudios = filteredStudios.filter(studio => 
        studio.studio_name.toLowerCase().includes(searchTerm) ||
        studio.studio_description.toLowerCase().includes(searchTerm) ||
        studio.studio_address.toLowerCase().includes(searchTerm)
      );
    }
    
    // Фильтр по типу
    if (currentFilters.type.length > 0) {
      filteredStudios = filteredStudios.filter(studio => 
        currentFilters.type.includes(studio.studio_type)
      );
    }
    
    // Фильтр по району
    if (currentFilters.district) {
      filteredStudios = filteredStudios.filter(studio => 
        studio.studio_district === currentFilters.district
      );
    }
    
    // Фильтр по цене
    filteredStudios = filteredStudios.filter(studio => 
      studio.studio_price >= currentFilters.minPrice && 
      studio.studio_price <= currentFilters.maxPrice
    );
    
    // Фильтр по удобствам
    if (currentFilters.amenities.length > 0) {
      filteredStudios = filteredStudios.filter(studio => {
        if (!studio.studio_amenities) return false;
        const studioAmenities = studio.studio_amenities.split(',');
        return currentFilters.amenities.every(amenity => 
          studioAmenities.includes(amenity.trim())
        );
      });
    }
    
    // Фильтр по услугам
    if (currentFilters.services.length > 0) {
      filteredStudios = filteredStudios.filter(studio => {
        if (!studio.studio_services) return false;
        const studioServices = studio.studio_services.split(',');
        return currentFilters.services.every(service => 
          studioServices.includes(service.trim())
        );
      });
    }
    
    // Сортировка
    switch (currentFilters.sort) {
      case 'price-desc':
        filteredStudios.sort((a, b) => b.studio_price - a.studio_price);
        break;
      case 'price-asc':
        filteredStudios.sort((a, b) => a.studio_price - b.studio_price);
        break;
      case 'rating':
        filteredStudios.sort((a, b) => (b.studio_rating || 0) - (a.studio_rating || 0));
        break;
      case 'popular':
      default:
        filteredStudios.sort((a, b) => (b.studio_reviews_count || 0) - (a.studio_reviews_count || 0));
    }
    
    renderStudioCards(filteredStudios);
    
  } catch (error) {
    console.error('Ошибка применения фильтров:', error);
    showError('Не удалось применить фильтры. Пожалуйста, попробуйте позже.');
  }
}

// Отрисовка карточек студий
function renderStudioCards(studios) {
  studioCardsContainer.innerHTML = '';

  if (!studios || studios.length === 0) {
    studioCardsContainer.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <p>Ничего не найдено. Попробуйте изменить параметры поиска.</p>
      </div>
    `;
    return;
  }

  studios.forEach((studio, index) => {
    const studioCard = document.createElement('div');
    studioCard.className = 'studio-card';
    studioCard.dataset.id = studio.studio_id;
    studioCard.style.animationDelay = `${index * 0.1}s`;

    studioCard.innerHTML = `
      <div class="studio-image">
        <img src="${studio.primary_image || '/images/default-studio.jpg'}" alt="${studio.studio_name}">
        <button class="favorite-btn">
          <i class="far fa-heart"></i>
        </button>
        <div class="studio-rating">
          <i class="fas fa-star"></i> ${studio.studio_rating ? studio.studio_rating : 'Нет оценок'}
        </div>
      </div>
      <div class="studio-info">
        <div class="studio-header">
          <h3>${studio.studio_name}</h3>
          <span class="studio-price">${studio.studio_price} руб/час</span>
        </div>
        <p class="studio-location">
          <i class="fas fa-map-marker-alt"></i> ${studio.studio_address}
          <span class="studio-district">${getDistrictName(studio.studio_district)}</span>
        </p>
        <p class="studio-description">
          ${studio.studio_description}
        </p>
        <div class="studio-footer">
          <div class="studio-features">
            <span><i class="fas fa-vector-square"></i> ${studio.studio_size} м²</span>
            ${studio.studio_amenities ? studio.studio_amenities.split(',').map(a => `<span class="amenity">${a.trim()}</span>`).join('') : ''}
          </div>
          <button class="book-btn">Забронировать</button>
        </div>
      </div>
    `;

    studioCardsContainer.appendChild(studioCard);
  });
}

function resetFilters() {
  // Сброс текущих фильтров
  currentFilters = {
    searchQuery: '',
    type: ['rehearsal', 'recording'],
    services: [],
    amenities: [],
    minPrice: 0,
    maxPrice: 10000,
    district: '',
    sort: 'popular',
    page: 1
  };

  // Сброс UI элементов
  searchInput.value = '';
  sortSelect.value = 'popular';
  districtSelect.value = '';
  minPriceInput.value = '0';
  maxPriceInput.value = '10000';
  minPriceSlider.value = '0';
  maxPriceSlider.value = '10000';
  
  // Сброс чекбоксов типов
  document.querySelectorAll('input[name="type"]').forEach(checkbox => {
    checkbox.checked = true;
  });
  
  // Сброс чекбоксов удобств
  document.querySelectorAll('input[name="amenity"]').forEach(checkbox => {
    checkbox.checked = false;
  });

  // Сброс чекбоксов услуг
  document.querySelectorAll('input[name="service"]').forEach(checkbox => {
    checkbox.checked = false;
  });

  applyFilters();
}

function showError(message) {
  studioCardsContainer.innerHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <p>${message}</p>
    </div>
  `;
}

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

// Вспомогательная функция для получения названия района
function getDistrictName(district) {
  const foundDistrict = allDistricts.find(d => d.value === district);
  return foundDistrict ? foundDistrict.label : district;
}

// Запуск приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', init);