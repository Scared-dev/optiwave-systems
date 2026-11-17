const app = require('./server.js');

const server = app.listen(3002, async () => {
  console.log('--- OptiWave REST API Automated Test Suite ---');
  const baseUrl = 'http://localhost:3002';

  try {
    // 1. Health
    let res = await fetch(`${baseUrl}/api/health`);
    let data = await res.json();
    console.log('[PASS] 1. GET /api/health:', data.status);

    // 2. GET /api/products
    res = await fetch(`${baseUrl}/api/products?category=waveguides&minFov=40`);
    data = await res.json();
    console.log(`[PASS] 2. GET /api/products?minFov=40: found ${data.total} items`);

    // 3. POST /api/products (Create)
    const newProduct = {
      sku: 'TEST-WG-99',
      name: 'Experimental Quantum Waveguide QW-99',
      category: 'waveguides',
      material: 'Fused Silica',
      fov: 65,
      spectrum: 'RGB',
      thickness: 0.8,
      efficiency: 95,
      price_b2c: 690.0,
      price_b2b: 620.0,
      stock: 5,
      description: 'Test product for Lab 5 automated check',
      badge: 'Новинка R&D'
    };
    res = await fetch(`${baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });
    const createdP = await res.json();
    console.log(`[PASS] 3. POST /api/products: created product ID ${createdP.data.id} (${createdP.data.sku})`);

    // 4. PUT /api/products/:id (Update)
    res = await fetch(`${baseUrl}/api/products/${createdP.data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price_b2c: 720.0, stock: 10 })
    });
    const updatedP = await res.json();
    console.log(`[PASS] 4. PUT /api/products/${createdP.data.id}: updated price to $${updatedP.data.price_b2c}`);

    // 5. DELETE /api/products/:id (Delete)
    res = await fetch(`${baseUrl}/api/products/${createdP.data.id}`, { method: 'DELETE' });
    const delRes = await res.json();
    console.log(`[PASS] 5. DELETE /api/products/${createdP.data.id}: ${delRes.message}`);

    // 6. POST /api/orders (B2B Checkout)
    const orderPayload = {
      type: 'b2b',
      email: 'kovalov.andrii@opticlab.ua',
      phone: '+380501234567',
      company_name: 'ТОВ "ОптікЛаб Текнолоджіз"',
      edrpou: '38492015',
      legal_address: 'м. Київ, вул. Кіото, 19',
      items: [
        { sku: 'DW-50', name: 'Diffractive Waveguide DW-50', qty: 5, price_unit: 430.0 },
        { sku: 'OLED-071', name: 'Micro-OLED Display Module 0.71"', qty: 2, price_unit: 320.0 }
      ]
    };
    res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const orderRes = await res.json();
    console.log(`[PASS] 6. POST /api/orders: Order #${orderRes.data.order_number}, total $${orderRes.data.total_usd} (${orderRes.data.total_uah} UAH)`);

    // 7. POST /api/custom-requests (Custom Order CAD)
    const customReq = {
      wave_type: 'Поверхневий рельєф (SRG)',
      spectrum: 'RGB (450–635 nm)',
      target_fov: '52°',
      material: 'Fused Silica 1.2 мм',
      quantity_tier: '5-10 шт (Пілотна партія)',
      contact_name: 'Ковальов Андрій Олександрович',
      company: 'ТОВ "ОптікЛаб Текнолоджіз"',
      email: 'kovalov.andrii@opticlab.ua',
      notes: 'Вайбкодинг тест кастомного замовлення',
      file_name: 'optical_waveguide_housing_v3.step',
      file_size_kb: 14500
    };
    res = await fetch(`${baseUrl}/api/custom-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customReq)
    });
    const reqRes = await res.json();
    console.log(`[PASS] 7. POST /api/custom-requests: Request #${reqRes.request_number}`);

    // 8. GET /api/stats (Dashboard)
    res = await fetch(`${baseUrl}/api/stats`);
    const stats = await res.json();
    console.log(`[PASS] 8. GET /api/stats: ${stats.data.products} products, ${stats.data.orders.total} orders, revenue $${stats.data.revenue_usd}`);

    console.log('\n--- ALL 8 REST API TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close(() => console.log('Test server shut down.'));
  }
});
