/**
 * OptiWave Systems — REST API Server
 * Лабораторна робота № 5: Вайбкодинг
 * Студент: Ковальов Андрій Олександрович, Групи 17 курсу 1
 *
 * Стек: Node.js v26 + Express 5 + SQLite (better-sqlite3)
 * Маршрути REST API:
 *   GET    /api/products           — список товарів (з пагінацією і фільтрацією)
 *   GET    /api/products/:id       — один товар
 *   POST   /api/products           — додати товар
 *   PUT    /api/products/:id       — оновити товар
 *   DELETE /api/products/:id       — видалити товар
 *   GET    /api/orders             — список замовлень
 *   POST   /api/orders             — створити замовлення (Checkout)
 *   GET    /api/orders/:id         — одне замовлення
 *   PATCH  /api/orders/:id/status  — змінити статус
 *   POST   /api/custom-requests    — надіслати кастомну заявку
 *   GET    /api/custom-requests    — список заявок
 *   GET    /api/stats              — статистика (для dashboard)
 */

'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const Database = require('better-sqlite3');

// ─── ІНІЦІАЛІЗАЦІЯ ───────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'optiwave.db');

// ─── MIDDLEWARE ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Роздача статичних файлів (клієнтська частина)
app.use(express.static(path.join(__dirname, 'optiwave-site')));

// ─── БАЗА ДАНИХ ──────────────────────────────────────────────
const db = new Database(DB_PATH);

// Увімкнення WAL-режиму для продуктивності
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── СХЕМА БД ────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    sku         TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    category    TEXT    NOT NULL DEFAULT 'waveguides',
    material    TEXT,
    fov         INTEGER,
    spectrum    TEXT,
    thickness   REAL,
    efficiency  INTEGER,
    price_b2c   REAL    NOT NULL,
    price_b2b   REAL,
    stock       INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    badge       TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT    NOT NULL UNIQUE,
    type         TEXT    NOT NULL DEFAULT 'b2c',
    email        TEXT    NOT NULL,
    phone        TEXT,
    company_name TEXT,
    edrpou       TEXT,
    legal_address TEXT,
    total_usd    REAL    NOT NULL,
    total_uah    REAL,
    vat_usd      REAL,
    discount_pct INTEGER DEFAULT 0,
    status       TEXT    NOT NULL DEFAULT 'pending',
    items_json   TEXT    NOT NULL DEFAULT '[]',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    sku        TEXT,
    name       TEXT    NOT NULL,
    qty        INTEGER NOT NULL DEFAULT 1,
    price_unit REAL    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS custom_requests (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    request_number TEXT   NOT NULL UNIQUE,
    wave_type     TEXT,
    spectrum      TEXT,
    target_fov    TEXT,
    material      TEXT,
    quantity_tier TEXT,
    contact_name  TEXT   NOT NULL,
    company       TEXT,
    email         TEXT   NOT NULL,
    notes         TEXT,
    file_name     TEXT,
    file_size_kb  INTEGER,
    status        TEXT   NOT NULL DEFAULT 'new',
    created_at    TEXT   NOT NULL DEFAULT (datetime('now'))
  );
`);

// ─── SEED ДАНИХ ──────────────────────────────────────────────
const seedProducts = db.prepare('SELECT COUNT(*) as cnt FROM products').get();
if (seedProducts.cnt === 0) {
  const insert = db.prepare(`
    INSERT INTO products (sku, name, category, material, fov, spectrum, thickness, efficiency, price_b2c, price_b2b, stock, description, badge)
    VALUES (@sku, @name, @category, @material, @fov, @spectrum, @thickness, @efficiency, @price_b2c, @price_b2b, @stock, @description, @badge)
  `);
  const seedMany = db.transaction((items) => { for (const i of items) insert.run(i); });

  seedMany([
    { sku:'DW-50', name:'Diffractive Waveguide DW-50 (RGB)', category:'waveguides',
      material:'Fused Silica', fov:50, spectrum:'RGB', thickness:1.5, efficiency:88,
      price_b2c:480.00, price_b2b:430.00, stock:24, badge:'В наявності',
      description:'Прецизійний дифракційний хвилевід для AR-окулярів. FOV 50°, RGB спектр, кварцова підкладка 1.5 мм.' },
    { sku:'HW-42', name:'Holographic Waveguide HW-42 Pro', category:'waveguides',
      material:'Fused Silica', fov:42, spectrum:'RGB', thickness:1.0, efficiency:90,
      price_b2c:410.00, price_b2b:370.00, stock:18, badge:'Хіт R&D',
      description:'Голографічний хвилевід ультратонкий 1.0 мм. 90% ефективність, підходить для компактних AR-гарнітур.' },
    { sku:'DW-52', name:'Wide-Field Waveguide DW-52 Max', category:'waveguides',
      material:'Fused Silica Premium', fov:52, spectrum:'RGB', thickness:1.8, efficiency:85,
      price_b2c:560.00, price_b2b:510.00, stock:12, badge:'Max Wide',
      description:'Найширший кут огляду у серії — 52°. Преміум кварц 1.8 мм для Enterprise-рішень.' },
    { sku:'SI-40', name:'Silicon IR Waveguide Si-40 NIR', category:'waveguides',
      material:'Monocrystalline Si', fov:40, spectrum:'NIR 850nm', thickness:1.5, efficiency:91,
      price_b2c:520.00, price_b2b:470.00, stock:8, badge:'NIR',
      description:'Кремнієвий хвилевід для інфрачервоного діапазону 850 нм. Сенсорний канал для eye-tracking.' },
    { sku:'WG-G45', name:'Monochrome Waveguide WG-G45', category:'waveguides',
      material:'Fused Silica', fov:45, spectrum:'Green 520nm', thickness:1.2, efficiency:94,
      price_b2c:350.00, price_b2b:310.00, stock:30, badge:'94% Eff',
      description:'Монохромний зелений хвилевід 94% ефективності. Оптимальний для тактичних HUD-дисплеїв.' },
    { sku:'LITE-38', name:'Compact AR Waveguide Lite-38', category:'waveguides',
      material:'Fused Silica', fov:38, spectrum:'RGB', thickness:1.0, efficiency:86,
      price_b2c:290.00, price_b2b:260.00, stock:40, badge:'35г',
      description:'Компактний хвилевід 35 грамів. Ідеальний для легких AR-окулярів та носимої електроніки.' },
    { sku:'OLED-071', name:'Micro-OLED Display Module 0.71"', category:'displays',
      material:null, fov:null, spectrum:'RGB', thickness:null, efficiency:null,
      price_b2c:320.00, price_b2b:280.00, stock:50, badge:'DevKit',
      description:'Мікродисплей 1920×1080 FHD, яскравість 3000 nits, контраст 100000:1. MIPI DSI інтерфейс.' },
    { sku:'AR-VX', name:'AR Headset Vision-X Enterprise', category:'headsets',
      material:null, fov:52, spectrum:'RGB', thickness:null, efficiency:null,
      price_b2c:1850.00, price_b2b:1700.00, stock:5, badge:'Enterprise',
      description:'4K UHD на кожне око. 6DoF Inside-out + Eye Tracking. Вага 320г. SDK для Unity/Unreal.' },
    { sku:'VR-PL', name:'VR ProLens Dev Edition', category:'headsets',
      material:null, fov:120, spectrum:'RGB', thickness:null, efficiency:null,
      price_b2c:1250.00, price_b2b:1150.00, stock:7, badge:'DevKit',
      description:'VR гарнітура для розробників. FOV 120°. Частота 120Hz. OpenXR сумісна.' },
  ]);
  console.log('[DB] Seed: 9 products inserted');
}

// ─── УТИЛІТИ ─────────────────────────────────────────────────

function genOrderNumber() {
  return `OW-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
}
function genRequestNumber() {
  return `CR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
}

/**
 * Валідація email
 */
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

// ─── МАРШРУТИ: PRODUCTS ──────────────────────────────────────

/**
 * GET /api/products
 * Query: ?category=waveguides&material=silica&minFov=35&maxFov=52&spectrum=rgb&page=1&limit=10
 */
app.get('/api/products', (req, res) => {
  try {
    const { category, material, spectrum, minFov, maxFov, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (material)  { sql += ' AND material LIKE ?'; params.push(`%${material}%`); }
    if (spectrum)  { sql += ' AND spectrum LIKE ?'; params.push(`%${spectrum}%`); }
    if (minFov)    { sql += ' AND fov >= ?'; params.push(Number(minFov)); }
    if (maxFov)    { sql += ' AND fov <= ?'; params.push(Number(maxFov)); }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    const { total } = db.prepare(countSql).get(...params);

    sql += ` ORDER BY id LIMIT ? OFFSET ?`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const products = db.prepare(sql).all(...params);
    res.json({ success: true, total, page: Number(page), limit: Number(limit), data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/products/:id
 */
app.get('/api/products/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/products
 * Body: { sku, name, category, price_b2c, ... }
 */
app.post('/api/products', (req, res) => {
  try {
    const { sku, name, category = 'waveguides', material, fov, spectrum, thickness,
            efficiency, price_b2c, price_b2b, stock = 0, description, badge } = req.body;

    if (!sku || !name || !price_b2c) {
      return res.status(400).json({ success: false, error: 'sku, name та price_b2c обов\'язкові' });
    }

    const stmt = db.prepare(`
      INSERT INTO products (sku, name, category, material, fov, spectrum, thickness, efficiency, price_b2c, price_b2b, stock, description, badge)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(sku, name, category, material, fov, spectrum, thickness, efficiency, price_b2c, price_b2b, stock, description, badge);
    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, error: `SKU "${req.body.sku}" вже існує` });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/products/:id
 */
app.put('/api/products/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Product not found' });

    const { name, category, material, fov, spectrum, thickness, efficiency,
            price_b2c, price_b2b, stock, description, badge } = req.body;

    db.prepare(`
      UPDATE products SET
        name=COALESCE(?,name), category=COALESCE(?,category), material=COALESCE(?,material),
        fov=COALESCE(?,fov), spectrum=COALESCE(?,spectrum), thickness=COALESCE(?,thickness),
        efficiency=COALESCE(?,efficiency), price_b2c=COALESCE(?,price_b2c),
        price_b2b=COALESCE(?,price_b2b), stock=COALESCE(?,stock),
        description=COALESCE(?,description), badge=COALESCE(?,badge)
      WHERE id = ?
    `).run(name, category, material, fov, spectrum, thickness, efficiency,
           price_b2c, price_b2b, stock, description, badge, req.params.id);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/products/:id
 */
app.delete('/api/products/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Product not found' });
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: `Product ${req.params.id} deleted` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── МАРШРУТИ: ORDERS ────────────────────────────────────────

/**
 * GET /api/orders
 */
app.get('/api/orders', (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (type)   { sql += ' AND type = ?';   params.push(type); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    const orders = db.prepare(sql).all(...params);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/orders/:id
 */
app.get('/api/orders/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    res.json({ success: true, data: { ...order, items } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/orders
 * Body: { type, email, phone, company_name, edrpou, legal_address, items: [{sku, name, qty, price_unit}] }
 */
app.post('/api/orders', (req, res) => {
  try {
    const { type = 'b2c', email, phone, company_name, edrpou, legal_address, items = [] } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Невірний або відсутній email' });
    }
    if (type === 'b2b' && (!edrpou || !/^\d{8}$/.test(edrpou))) {
      return res.status(400).json({ success: false, error: 'ЄДРПОУ повинен містити 8 цифр (B2B обов\'язково)' });
    }
    if (!items.length) {
      return res.status(400).json({ success: false, error: 'Замовлення не може бути порожнім' });
    }

    // Розрахунок суми
    let subtotal = items.reduce((s, i) => s + (i.price_unit * i.qty), 0);
    const discount = type === 'b2b' ? 0.10 : 0;
    const total_usd = +(subtotal * (1 - discount)).toFixed(2);
    const vat_usd   = +(total_usd / 6).toFixed(2); // ПДВ 20% включено
    const total_uah = +(total_usd * 41.0).toFixed(2);

    const order_number = genOrderNumber();

    // Вставляємо в транзакції
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_number, type, email, phone, company_name, edrpou, legal_address, total_usd, total_uah, vat_usd, discount_pct, items_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, sku, name, qty, price_unit) VALUES (?, ?, ?, ?, ?)
    `);

    const createOrder = db.transaction(() => {
      const r = insertOrder.run(order_number, type, email, phone, company_name, edrpou,
                                legal_address, total_usd, total_uah, vat_usd,
                                Math.round(discount * 100), JSON.stringify(items));
      for (const item of items) {
        insertItem.run(r.lastInsertRowid, item.sku, item.name, item.qty, item.price_unit);
      }
      return r.lastInsertRowid;
    });

    const orderId = createOrder();
    const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    res.status(201).json({
      success: true,
      message: `Замовлення ${order_number} прийнято. Рахунок-фактуру надіслано на ${email}`,
      data: created
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/orders/:id/status
 * Body: { status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' }
 */
app.patch('/api/orders/:id/status', (req, res) => {
  try {
    const VALID_STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled'];
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: `Невірний статус. Допустимі: ${VALID_STATUSES.join(', ')}` });
    }
    const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Order not found' });
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true, message: `Статус замовлення #${req.params.id} змінено на "${status}"` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── МАРШРУТИ: CUSTOM REQUESTS ───────────────────────────────

/**
 * POST /api/custom-requests
 * Body: { wave_type, spectrum, target_fov, material, quantity_tier, contact_name, company, email, notes, file_name, file_size_kb }
 */
app.post('/api/custom-requests', (req, res) => {
  try {
    const { wave_type, spectrum, target_fov, material, quantity_tier,
            contact_name, company, email, notes, file_name, file_size_kb } = req.body;

    if (!contact_name || !email) {
      return res.status(400).json({ success: false, error: 'contact_name та email обов\'язкові' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Невірний формат email' });
    }

    const request_number = genRequestNumber();
    db.prepare(`
      INSERT INTO custom_requests (request_number, wave_type, spectrum, target_fov, material, quantity_tier, contact_name, company, email, notes, file_name, file_size_kb)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(request_number, wave_type, spectrum, target_fov, material, quantity_tier,
           contact_name, company, email, notes, file_name, file_size_kb);

    res.status(201).json({
      success: true,
      message: `Заявку ${request_number} прийнято. Відповідь протягом 24 годин на ${email}`,
      request_number
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/custom-requests
 */
app.get('/api/custom-requests', (req, res) => {
  try {
    const requests = db.prepare('SELECT * FROM custom_requests ORDER BY created_at DESC').all();
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── СТАТИСТИКА ──────────────────────────────────────────────

/**
 * GET /api/stats
 */
app.get('/api/stats', (req, res) => {
  try {
    const totalProducts  = db.prepare('SELECT COUNT(*) as n FROM products').get().n;
    const totalOrders    = db.prepare('SELECT COUNT(*) as n FROM orders').get().n;
    const totalRevenue   = db.prepare("SELECT COALESCE(SUM(total_usd),0) as s FROM orders WHERE status != 'cancelled'").get().s;
    const pendingOrders  = db.prepare("SELECT COUNT(*) as n FROM orders WHERE status = 'pending'").get().n;
    const totalRequests  = db.prepare('SELECT COUNT(*) as n FROM custom_requests').get().n;
    const topProducts    = db.prepare(`
      SELECT p.sku, p.name, SUM(oi.qty) as total_qty
      FROM order_items oi JOIN products p ON oi.sku = p.sku
      GROUP BY oi.sku ORDER BY total_qty DESC LIMIT 3
    `).all();

    res.json({
      success: true,
      data: {
        products: totalProducts,
        orders: { total: totalOrders, pending: pendingOrders },
        revenue_usd: +totalRevenue.toFixed(2),
        custom_requests: totalRequests,
        top_products: topProducts,
        server_time: new Date().toISOString(),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime().toFixed(1) + 's', db: DB_PATH });
});

// ─── SPA FALLBACK ─────────────────────────────────────────────
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'optiwave-site', 'index.html'));
});

// ─── СТАРТ ────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n⚡ OptiWave Systems API Server`);
    console.log(`   URL:  http://localhost:${PORT}`);
    console.log(`   API:  http://localhost:${PORT}/api/products`);
    console.log(`   DB:   ${DB_PATH}`);
    console.log(`   Env:  Node.js ${process.version} / Express\n`);
  });
}

module.exports = app;
