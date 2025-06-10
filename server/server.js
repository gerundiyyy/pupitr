const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Настройка подключения к базе данных
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'pipik091pipik091',
  database: process.env.DB_NAME || 'pupitre',
  waitForConnections: true,
  connectionLimit: 10,
});

// Middleware для логирования запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API для получения студий с фильтрацией
app.get('/api/studios', async (req, res) => {
  try {
    const { search, type, district, minPrice, maxPrice, amenities, services, sort } = req.query;
    
    let query = `
      SELECT 
        s.*, 
        u.user_name as owner_name,
        u.user_phone as owner_phone,
        (SELECT image_url FROM studio_images WHERE image_studio_id = s.studio_id LIMIT 1) as primary_image,
        (SELECT AVG(review_rating) FROM reviews WHERE review_studio_id = s.studio_id) as studio_rating,
        (SELECT COUNT(*) FROM reviews WHERE review_studio_id = s.studio_id) as studio_reviews_count
      FROM studios s
      JOIN users u ON s.studio_owner_id = u.user_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (search) {
      query += ' AND (s.studio_name LIKE ? OR s.studio_description LIKE ? OR s.studio_address LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (type) {
      query += ' AND s.studio_type = ?';
      params.push(type);
    }
    
    if (district) {
      query += ' AND s.studio_district = ?';
      params.push(district);
    }
    
    if (minPrice) {
      query += ' AND s.studio_price >= ?';
      params.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      query += ' AND s.studio_price <= ?';
      params.push(parseFloat(maxPrice));
    }
    
    if (amenities) {
      const amenitiesList = amenities.split(',');
      amenitiesList.forEach(amenity => {
        query += ` AND FIND_IN_SET(?, s.studio_amenities)`;
        params.push(amenity.trim());
      });
    }
    
    if (services) {
      const servicesList = services.split(',');
      servicesList.forEach(service => {
        query += ` AND FIND_IN_SET(?, s.studio_services)`;
        params.push(service.trim());
      });
    }
    
    // Сортировка
    switch (sort) {
      case 'price-desc':
        query += ' ORDER BY s.studio_price DESC';
        break;
      case 'price-asc':
        query += ' ORDER BY s.studio_price ASC';
        break;
      case 'rating':
        query += ' ORDER BY studio_rating DESC';
        break;
      case 'popular':
      default:
        query += ' ORDER BY (SELECT COUNT(*) FROM bookings WHERE booking_studio_id = s.studio_id) DESC';
    }
    
    const [studios] = await pool.query(query, params);
    
    res.json(studios);
  } catch (error) {
    console.error('Error fetching studios:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API для получения всех районов
app.get('/api/districts', async (req, res) => {
  try {
    const districts = [
      { value: 'center', label: 'Центральный' },
      { value: 'soviet', label: 'Советский' },
      { value: 'october', label: 'Октябрьский' },
      { value: 'lenin', label: 'Ленинский' }
    ];
    res.json(districts);
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API для получения всех типов студий
app.get('/api/studio-types', async (req, res) => {
  try {
    const types = [
      { value: 'rehearsal', label: 'Репетиционная база' },
      { value: 'recording', label: 'Студия звукозаписи' }
    ];
    res.json(types);
  } catch (error) {
    console.error('Error fetching studio types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API для получения всех удобств
app.get('/api/amenities', async (req, res) => {
  try {
    const amenities = [
      { value: 'Wi-Fi', label: 'Wi-Fi' },
      { value: 'Парковка', label: 'Парковка' },
      { value: 'Кондиционер', label: 'Кондиционер' },
      { value: 'Зона отдыха', label: 'Зона отдыха' },
      { value: 'Кофемашина', label: 'Кофемашина' }
    ];
    res.json(amenities);
  } catch (error) {
    console.error('Error fetching amenities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API для получения всех услуг
app.get('/api/services', async (req, res) => {
  try {
    const services = [
      { value: 'Звукозапись', label: 'Звукозапись' },
      { value: 'Сведение', label: 'Сведение' },
      { value: 'Мастеринг', label: 'Мастеринг' },
      { value: 'Озвучивание', label: 'Озвучивание' },
      { value: 'Аранжировка', label: 'Аранжировка' },
      { value: 'Запись демо', label: 'Запись демо' },
      { value: 'Обработка голоса', label: 'Обработка голоса' }
    ];
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API для получения изображений студии
app.get('/api/studios/:id/images', async (req, res) => {
  try {
    const [images] = await pool.query(
      'SELECT * FROM studio_images WHERE image_studio_id = ?',
      [req.params.id]
    );
    res.json(images);
  } catch (error) {
    console.error('Error fetching studio images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API для получения отзывов о студии
app.get('/api/studios/:id/reviews', async (req, res) => {
  try {
    const [reviews] = await pool.query(
      `SELECT r.*, u.user_name, u.user_avatar 
       FROM reviews r
       JOIN users u ON r.review_user_id = u.user_id
       WHERE r.review_studio_id = ?
       ORDER BY r.review_created_at DESC`,
      [req.params.id]
    );
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching studio reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API для получения бронирований студии
// API для получения бронирований студии
app.get('/api/studios/:id/bookings', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT booking_id, booking_start_time, booking_end_time, booking_status
      FROM bookings
      WHERE booking_studio_id = ?
    `;
    
    const params = [req.params.id];
    
    if (start_date && end_date) {
      query += ` AND ( 
        (booking_start_time BETWEEN ? AND ?) OR 
        (booking_end_time BETWEEN ? AND ?) OR 
        (booking_start_time <= ? AND booking_end_time >= ?)
      )`;
      
      params.push(start_date, end_date, start_date, end_date, start_date, end_date);
    }

    query += ' ORDER BY booking_start_time ASC';

    const [bookings] = await pool.query(query, params);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching studio bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// API для получения избранных студий пользователя
app.get('/api/users/:id/favorites', async (req, res) => {
  try {
    const [favorites] = await pool.query(
      `SELECT s.*, 
       (SELECT image_url FROM studio_images WHERE image_studio_id = s.studio_id LIMIT 1) as primary_image
       FROM studios s
       JOIN favorites f ON s.studio_id = f.favorite_studio_id
       WHERE f.favorite_user_id = ?`,
      [req.params.id]
    );
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API для добавления студии в избранное
app.post('/api/users/:userId/favorites/:studioId', async (req, res) => {
  try {
    const [result] = await pool.query(
      'INSERT INTO favorites (favorite_user_id, favorite_studio_id) VALUES (?, ?)',
      [req.params.userId, req.params.studioId]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API для удаления студии из избранного
app.delete('/api/users/:userId/favorites/:studioId', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM favorites WHERE favorite_user_id = ? AND favorite_studio_id = ?',
      [req.params.userId, req.params.studioId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API для создания бронирования
app.post('/api/bookings', async (req, res) => {
  try {
    const { studio_id, user_id, start_time, end_time, total_price } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO bookings 
       (booking_studio_id, booking_user_id, booking_start_time, booking_end_time, booking_total_price)
       VALUES (?, ?, ?, ?, ?)`,
      [studio_id, user_id, start_time, end_time, total_price]
    );
    
    res.status(201).json({ booking_id: result.insertId });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API для создания отзыва
app.post('/api/reviews', async (req, res) => {
  try {
    const { studio_id, user_id, rating, comment } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO reviews 
       (review_studio_id, review_user_id, review_rating, review_comment)
       VALUES (?, ?, ?, ?)`,
      [studio_id, user_id, rating, comment]
    );
    
    // Обновляем рейтинг студии
    await pool.query(
      `UPDATE studios 
       SET studio_rating = (SELECT AVG(review_rating) FROM reviews WHERE review_studio_id = ?),
           studio_reviews_count = (SELECT COUNT(*) FROM reviews WHERE review_studio_id = ?)
       WHERE studio_id = ?`,
      [studio_id, studio_id, studio_id]
    );
    
    res.status(201).json({ review_id: result.insertId });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});