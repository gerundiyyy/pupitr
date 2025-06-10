document.addEventListener('DOMContentLoaded', function() {
  // Инициализация Flatpickr для выбора даты
  flatpickr("#datePicker", {
    mode: "range",
    dateFormat: "d.m.Y",
    locale: "ru",
    allowInput: true,
    onClose: function(selectedDates, dateStr, instance) {
      if (selectedDates.length === 2) {
        applyFilters();
      }
    }
  });

  // Элементы DOM
  const ordersContainer = document.querySelector('.orders-container');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.querySelector('.search-btn');
  const clearFiltersBtn = document.querySelector('.clear-filters');
  const sortSelect = document.querySelector('.sort-select');
  const statusCheckboxes = document.querySelectorAll('input[name="status"]');
  const serviceCheckboxes = document.querySelectorAll('input[name="service"]');
  const datePicker = document.getElementById('datePicker');

  // Текущие фильтры
  let currentFilters = {
    searchQuery: '',
    status: ['planned', 'completed'],
    services: ['rehearsal', 'recording'],
    dateRange: null,
    sort: 'date-desc'
  };

  // Загрузка данных
  function loadOrders() {
    showLoading();
    
    // Здесь должен быть запрос к API, но для демонстрации используем моковые данные
    setTimeout(() => {
      const mockOrders = generateMockOrders();
      applyFiltersToOrders(mockOrders);
    }, 800);
  }

  // Генерация моковых данных для демонстрации
  function generateMockOrders() {
    const services = ['rehearsal', 'recording', 'mixing'];
    const statuses = ['planned', 'completed', 'cancelled'];
    const studios = [
      { id: 1, name: 'Студия SoundPro', type: 'Профессиональная' },
      { id: 2, name: 'Звукозапись Hi-Tone', type: 'Полупрофессиональная' },
      { id: 3, name: 'Реп. точка RockStar', type: 'Любительская' }
    ];
    
    const orders = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const daysOffset = Math.floor(Math.random() * 30) - 15;
      const orderDate = new Date(now);
      orderDate.setDate(now.getDate() + daysOffset);
      
      orders.push({
        id: 1000 + i,
        studio: studios[Math.floor(Math.random() * studios.length)],
        service: services[Math.floor(Math.random() * services.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        date: orderDate,
        time: `${Math.floor(Math.random() * 12) + 10}:00 - ${Math.floor(Math.random() * 12) + 10 + 2}:00`,
        price: Math.floor(Math.random() * 5000) + 1000,
        payment: ['Наличные', 'Карта'][Math.floor(Math.random() * 2)]
      });
    }
    
    return orders;
  }

  // Применение фильтров к заказам
  function applyFiltersToOrders(orders) {
    let filteredOrders = [...orders];
    
    // Фильтр по поисковому запросу
    if (currentFilters.searchQuery) {
      const query = currentFilters.searchQuery.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.studio.name.toLowerCase().includes(query) || 
        order.service.toLowerCase().includes(query)
      );
    }
    
    // Фильтр по статусу
    filteredOrders = filteredOrders.filter(order => 
      currentFilters.status.includes(order.status)
    );
    
    // Фильтр по услугам
    filteredOrders = filteredOrders.filter(order => 
      currentFilters.services.includes(order.service)
    );
    
    // Фильтр по дате
    if (currentFilters.dateRange) {
      const [startDate, endDate] = currentFilters.dateRange;
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }
    
    // Сортировка
    filteredOrders = sortOrders(filteredOrders);
    
    // Отображение результатов
    renderOrders(filteredOrders);
  }

  // Сортировка заказов
  function sortOrders(orders) {
    switch(currentFilters.sort) {
      case 'date-asc':
        return [...orders].sort((a, b) => new Date(a.date) - new Date(b.date));
      case 'price-desc':
        return [...orders].sort((a, b) => b.price - a.price);
      case 'price-asc':
        return [...orders].sort((a, b) => a.price - b.price);
      case 'date-desc':
      default:
        return [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  }

  // Отрисовка заказов
  function renderOrders(orders) {
    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <p>Заказы не найдены. Попробуйте изменить параметры поиска.</p>
        </div>
      `;
      return;
    }
    
    ordersContainer.innerHTML = '';
    
    orders.forEach(order => {
      const orderCard = document.createElement('div');
      orderCard.className = 'order-card';
      
      // Форматирование даты
      const orderDate = new Date(order.date);
      const formattedDate = orderDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      // Получение названия услуги
      const serviceNames = {
        rehearsal: 'Репетиция',
        recording: 'Запись',
        mixing: 'Сведение'
      };
      
      // Получение класса статуса
      const statusClasses = {
        planned: 'planned',
        completed: 'completed',
        cancelled: 'cancelled'
      };
      
      const statusTexts = {
        planned: 'Запланирован',
        completed: 'Завершен',
        cancelled: 'Отменен'
      };
      
      orderCard.innerHTML = `
        <div class="order-header">
          <div class="studio-info">
            <div class="studio-name">${order.studio.name}</div>
            <div class="studio-type">${order.studio.type}</div>
          </div>
          <div class="order-status ${statusClasses[order.status]}">${statusTexts[order.status]}</div>
        </div>
        
        <div class="order-details">
          <div class="service-info">
            <div class="service-type">${serviceNames[order.service]}</div>
            <div class="date-time">
              <i class="far fa-calendar-alt"></i> ${formattedDate}
            </div>
            <div class="date-time">
              <i class="far fa-clock"></i> ${order.time}
            </div>
          </div>
          
          <div class="price-info">
            <div class="price">${order.price.toLocaleString('ru-RU')} ₽</div>
            <div class="payment-method">
              <i class="fas fa-credit-card"></i> ${order.payment}
            </div>
          </div>
        </div>
        
        <div class="order-actions">
          ${order.status === 'planned' ? `
            <button class="action-btn call-btn">
              <i class="fas fa-phone"></i> Позвонить
            </button>
            <button class="action-btn message-btn">
              <i class="fas fa-comment"></i> Написать
            </button>
            <button class="action-btn cancel-btn">
              <i class="fas fa-times"></i> Отменить
            </button>
          ` : ''}
          
          ${order.status === 'completed' ? `
            <button class="action-btn review-btn">
              <i class="fas fa-star"></i> Оставить отзыв
            </button>
          ` : ''}
        </div>
      `;
      
      ordersContainer.appendChild(orderCard);
    });
    
    // Обновление индикатора сортировки
    updateSortIndicator(orders.length);
  }

  // Обновление индикатора сортировки
  function updateSortIndicator(count) {
    const indicator = document.querySelector('.sort-indicator');
    let statusText = '';
    
    if (currentFilters.status.length === 1) {
      statusText = currentFilters.status[0] === 'planned' ? 'Планируемые' :
                  currentFilters.status[0] === 'completed' ? 'Завершенные' : 'Отмененные';
    } else if (currentFilters.status.length === 2 && 
               currentFilters.status.includes('planned') && 
               currentFilters.status.includes('completed')) {
      statusText = 'Активные';
    } else {
      statusText = 'Все';
    }
    
    indicator.textContent = `Показаны: ${statusText} заказы (${count})`;
  }

  // Показать загрузку
  function showLoading() {
    ordersContainer.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Загрузка заказов...</p>
      </div>
    `;
  }

  // Применение фильтров
  function applyFilters() {
    // Обновляем текущие фильтры
    currentFilters.searchQuery = searchInput.value.trim();
    
    currentFilters.status = [];
    document.querySelectorAll('input[name="status"]:checked').forEach(checkbox => {
      currentFilters.status.push(checkbox.value);
    });
    
    currentFilters.services = [];
    document.querySelectorAll('input[name="service"]:checked').forEach(checkbox => {
      currentFilters.services.push(checkbox.value);
    });
    
    currentFilters.sort = sortSelect.value;
    
    // Получаем диапазон дат из Flatpickr
    const selectedDates = flatpickr.parseDate(datePicker.value, "d.m.Y");
    if (selectedDates && selectedDates.length === 2) {
      currentFilters.dateRange = selectedDates;
    } else {
      currentFilters.dateRange = null;
    }
    
    // Перезагружаем заказы с новыми фильтрами
    loadOrders();
  }

  // Сброс фильтров
  function resetFilters() {
    searchInput.value = '';
    sortSelect.value = 'date-desc';
    
    document.querySelectorAll('input[name="status"]').forEach(checkbox => {
      checkbox.checked = checkbox.value === 'planned' || checkbox.value === 'completed';
    });
    
    document.querySelectorAll('input[name="service"]').forEach(checkbox => {
      checkbox.checked = checkbox.value === 'rehearsal' || checkbox.value === 'recording';
    });
    
    // Сброс выбора даты
    if (window.flatpickr) {
      flatpickr("#datePicker").clear();
    }
    
    // Обновляем текущие фильтры
    currentFilters = {
      searchQuery: '',
      status: ['planned', 'completed'],
      services: ['rehearsal', 'recording'],
      dateRange: null,
      sort: 'date-desc'
    };
    
    // Перезагружаем заказы
    loadOrders();
  }

  // Настройка обработчиков событий
  function setupEventListeners() {
    // Поиск
    searchInput.addEventListener('input', debounce(applyFilters, 300));
    searchBtn.addEventListener('click', applyFilters);
    
    // Фильтры
    statusCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', applyFilters);
    });
    
    serviceCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', applyFilters);
    });
    
    // Сортировка
    sortSelect.addEventListener('change', applyFilters);
    
    // Сброс фильтров
    clearFiltersBtn.addEventListener('click', resetFilters);
    
    // Обработчики для кнопок действий (делегирование событий)
    ordersContainer.addEventListener('click', function(e) {
      if (e.target.closest('.call-btn')) {
        alert('Функция "Позвонить" будет реализована в будущем обновлении!');
      } else if (e.target.closest('.message-btn')) {
        alert('Функция "Написать" будет реализована в будущем обновлении!');
      } else if (e.target.closest('.cancel-btn')) {
        if (confirm('Вы уверены, что хотите отменить этот заказ?')) {
          alert('Заказ отменен!');
          loadOrders();
        }
      } else if (e.target.closest('.review-btn')) {
        alert('Функция "Оставить отзыв" будет реализована в будущем обновлении!');
      }
    });
  }

  // Функция для дебаунса
  function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }

  // Инициализация
  setupEventListeners();
  loadOrders();
});