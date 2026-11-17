/**
 * OptiWave Systems — JavaScript Module
 * Лабораторна робота № 4: Удосконалення вебсайту засобами JavaScript
 * Студент: Ковальов Андрій Олександрович, Групи 17 курсу 1
 *
 * Реалізовані компоненти:
 *  1. Мобільне меню (Mobile Nav Toggle) — інтерактивна навігація
 *  2. Toast / Notification System — динамічне виведення повідомлень
 *  3. Фільтрація каталогу в реальному часі (catalog.html) — динамічна зміна вмісту
 *  4. FOV Slider live update (catalog.html) — інтерактивний компонент 1
 *  5. Tabs на головній сторінці (index.html) — інтерактивний компонент 2
 *  6. Валідація форми Checkout (checkout.html) + B2C/B2B toggle
 *  7. Валідація форми Custom Order (custom-order.html) + file type check
 *  8. Comparison — підсвітка відмінностей + очищення + додавання
 *  9. Cart Counter — динамічне оновлення лічильника кошика
 * 10. Accordion / FAQ — розгортання блоків без перезавантаження
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   УТИЛІТИ
═══════════════════════════════════════════════════════════ */

/**
 * Вибирає один елемент або повертає null
 * @param {string} selector
 * @param {Element} [scope=document]
 * @returns {Element|null}
 */
function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

/**
 * Вибирає всі елементи та повертає масив
 * @param {string} selector
 * @param {Element} [scope=document]
 * @returns {Element[]}
 */
function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

/* ═══════════════════════════════════════════════════════════
   1. TOAST / NOTIFICATION SYSTEM
   Компонент: динамічне виведення повідомлень без перезавантаження
═══════════════════════════════════════════════════════════ */

/**
 * Об'єкт для керування Toast-повідомленнями
 */
const Toast = {
  container: null,

  /**
   * Ініціалізація контейнера Toast
   */
  init() {
    if (!qs('#toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '360px',
      });
      document.body.appendChild(container);
      this.container = container;
    } else {
      this.container = qs('#toast-container');
    }
  },

  /**
   * Показати Toast-повідомлення
   * @param {string} message — текст повідомлення
   * @param {'success'|'error'|'info'|'warning'} [type='info'] — тип
   * @param {number} [duration=3500] — час у мс
   */
  show(message, type = 'info', duration = 3500) {
    this.init();

    const colors = {
      success: { bg: '#0B192C', border: '#00D8F6', icon: '✅' },
      error:   { bg: '#1A0B0B', border: '#EF4444', icon: '❌' },
      warning: { bg: '#1A150B', border: '#F59E0B', icon: '⚠️' },
      info:    { bg: '#0B192C', border: '#0284C7', icon: 'ℹ️' },
    };
    const cfg = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.setAttribute('role', 'alert');
    Object.assign(toast.style, {
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderLeft: `4px solid ${cfg.border}`,
      color: '#F8FAFC',
      padding: '14px 18px',
      borderRadius: '8px',
      fontSize: '13px',
      fontFamily: 'Inter, sans-serif',
      lineHeight: '1.5',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      animation: 'slideInRight 0.3s ease',
      cursor: 'pointer',
      userSelect: 'none',
    });

    toast.innerHTML = `<span style="font-size:16px;flex-shrink:0;">${cfg.icon}</span><span>${message}</span>`;
    this.container.appendChild(toast);

    // Додаємо анімацію через stylesheet (одноразово)
    if (!qs('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(120%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Закриття після duration
    const remove = () => {
      toast.style.animation = 'slideOutRight 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    };
    const timer = setTimeout(remove, duration);
    toast.addEventListener('click', () => { clearTimeout(timer); remove(); });
  },
};

/* ═══════════════════════════════════════════════════════════
   2. МОБІЛЬНЕ МЕНЮ (Burger Nav Toggle)
   Компонент: інтерактивна навігація з обробниками подій
═══════════════════════════════════════════════════════════ */

function initMobileNav() {
  const toggleBtn = qs('.menu-toggle');
  const navLinks  = qs('.nav-links');
  if (!toggleBtn || !navLinks) return;

  // Гарантуємо CSS для відображення на мобільному
  const navStyle = document.createElement('style');
  navStyle.textContent = `
    @media (max-width: 768px) {
      .nav-links { display: none; flex-direction: column; }
      .nav-links.show { display: flex; }
      .menu-toggle { display: block; }
    }
    @media (min-width: 769px) {
      .nav-links { display: flex !important; }
      .menu-toggle { display: none; }
    }
  `;
  document.head.appendChild(navStyle);

  toggleBtn.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('show');
    toggleBtn.setAttribute('aria-expanded', isOpen);
    toggleBtn.textContent = isOpen ? '✕' : '☰';
  });

  // Закриття при кліку за межами навігації
  document.addEventListener('click', (e) => {
    if (!e.target.closest('header')) {
      navLinks.classList.remove('show');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.textContent = '☰';
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   3. КОШИК — ДИНАМІЧНИЙ ЛІЧИЛЬНИК
   Компонент: зміна вмісту без перезавантаження сторінки
═══════════════════════════════════════════════════════════ */

const Cart = {
  count: parseInt(localStorage.getItem('optiwave_cart') || '2', 10),

  updateUI() {
    qsa('.cart-indicator').forEach(el => {
      el.textContent = `🛒 Кошик (${this.count})`;
    });
  },

  add(productName) {
    this.count++;
    localStorage.setItem('optiwave_cart', this.count);
    this.updateUI();
    Toast.show(`«${productName}» додано до кошика!`, 'success');
  },

  init() {
    this.updateUI();

    // Делегування подій на "В кошик" кнопки
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add-to-cart]');
      if (!btn) return;
      e.preventDefault();
      const name = btn.dataset.addToCart || 'Товар';
      this.add(name);
    });
  },
};

/* ═══════════════════════════════════════════════════════════
   4. ФІЛЬТРАЦІЯ КАТАЛОГУ В РЕАЛЬНОМУ ЧАСІ (catalog.html)
   Компонент: динамічна фільтрація товарів — інтерактивний компонент 1
═══════════════════════════════════════════════════════════ */

function initCatalogFilters() {
  const productGrid = qs('.product-grid');
  if (!productGrid) return;
  if (!qs('.filter-sidebar')) return; // Лише на сторінці каталогу

  const cards = qsa('.product-card', productGrid);

  // Дані товарів (витягуємо з DOM)
  const products = cards.map(card => ({
    el: card,
    text: card.textContent.toLowerCase(),
    fov: parseInt((card.textContent.match(/fov\s*(\d+)/i) || [0, 0])[1], 10),
    material: card.textContent.toLowerCase().includes('кварц') ? 'silica' :
              card.textContent.toLowerCase().includes('кремній') ? 'silicon' :
              card.textContent.toLowerCase().includes('полімер') ? 'polymer' : 'other',
    spectrum: card.textContent.toLowerCase().includes('rgb') ? 'rgb' :
              card.textContent.toLowerCase().includes('520') ? 'green' :
              card.textContent.toLowerCase().includes('635') ? 'red' :
              card.textContent.toLowerCase().includes('850') || card.textContent.toLowerCase().includes('nir') ? 'nir' : 'other',
  }));

  // FOV Slider — живе оновлення
  const fovSlider = qs('input[type="range"]');
  const fovLabel  = qs('.filter-title');

  if (fovSlider && fovLabel) {
    // Зберігаємо вихідний текст
    const baseFovLabel = 'Кут огляду (FOV): від';

    fovSlider.addEventListener('input', () => {
      const val = parseInt(fovSlider.value, 10);
      fovLabel.textContent = `${baseFovLabel} ${val}°`;
      applyFilters();
    });
  }

  // Чекбокси матеріалу
  const matCheckboxes = qsa('.filter-group:nth-child(2) input[type="checkbox"]');
  matCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));

  // Чекбокси спектру
  const specCheckboxes = qsa('.filter-group:nth-child(3) input[type="checkbox"]');
  specCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));

  // Лічильник знайдених результатів
  const countEl = qs('.container p');

  /**
   * Застосовує всі фільтри та показує/приховує картки
   */
  function applyFilters() {
    const minFov = fovSlider ? parseInt(fovSlider.value, 10) : 0;

    // Вибрані матеріали
    const selectedMats = Array.from(matCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.parentElement.textContent.trim().toLowerCase());

    // Вибрані спектри
    const selectedSpecs = Array.from(specCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.parentElement.textContent.trim().toLowerCase());

    let visibleCount = 0;

    products.forEach(p => {
      let show = true;

      // Фільтр FOV
      if (p.fov && p.fov < minFov) show = false;

      // Фільтр матеріалу (якщо щось вибрано)
      if (selectedMats.length > 0) {
        const matchesMat = selectedMats.some(mat =>
          (mat.includes('кварц') && p.material === 'silica') ||
          (mat.includes('кремній') || mat.includes('silicon') && p.material === 'silicon') ||
          (mat.includes('полімер') && p.material === 'polymer')
        );
        if (!matchesMat) show = false;
      }

      // Фільтр спектру (якщо щось вибрано)
      if (selectedSpecs.length > 0) {
        const matchesSpec = selectedSpecs.some(spec =>
          (spec.includes('rgb') && p.spectrum === 'rgb') ||
          (spec.includes('520') && p.spectrum === 'green') ||
          (spec.includes('635') && p.spectrum === 'red') ||
          ((spec.includes('nir') || spec.includes('850')) && p.spectrum === 'nir')
        );
        if (!matchesSpec) show = false;
      }

      // Показати/приховати картку з плавним переходом
      if (show) {
        p.el.style.display = '';
        p.el.style.opacity = '1';
        visibleCount++;
      } else {
        p.el.style.display = 'none';
        p.el.style.opacity = '0';
      }
    });

    // Оновлення лічильника
    if (countEl) {
      countEl.textContent = `Прецизійні дифракційні решітки та голографічні хвилеводи для R&D інженерів. Знайдено ${visibleCount} компонентів.`;
    }

    // Toast якщо нічого не знайдено
    if (visibleCount === 0) {
      Toast.show('За обраними фільтрами нічого не знайдено. Скиньте фільтри або замовте кастомний компонент.', 'warning', 4000);
    }
  }

  // Кнопка «Скинути все»
  const resetBtn = qs('a[href="catalog.html"]', qs('.filter-sidebar'));
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      matCheckboxes.forEach((cb, i) => { cb.checked = i === 0; });
      specCheckboxes.forEach((cb, i) => { cb.checked = i === 0; });
      if (fovSlider) fovSlider.value = 30;
      applyFilters();
      Toast.show('Фільтри скинуті', 'info', 2000);
    });
  }

  // Очищення активних чіпів
  const clearChips = qs('.badge-navy[style*="cursor"]');
  if (clearChips) {
    clearChips.addEventListener('click', () => {
      matCheckboxes.forEach((cb, i) => { cb.checked = i === 0; });
      specCheckboxes.forEach((cb, i) => { cb.checked = i === 0; });
      applyFilters();
    });
  }

  applyFilters(); // початкове застосування
}

/* ═══════════════════════════════════════════════════════════
   5. TABS НА ГОЛОВНІЙ СТОРІНЦІ — ДИНАМІЧНА ЗМІНА ВМІСТУ
   Компонент: Tab-перемикач категорій — інтерактивний компонент 2
═══════════════════════════════════════════════════════════ */

function initHomeTabs() {
  const tabsWrapper = qs('#home-tabs');
  if (!tabsWrapper) return;

  const tabBtns    = qsa('[data-tab]', tabsWrapper);
  const tabPanels  = qsa('[data-panel]', tabsWrapper);

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      // Деактивуємо всі
      tabBtns.forEach(b => {
        b.classList.remove('tab-active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach(p => {
        p.style.display = 'none';
        p.setAttribute('hidden', '');
      });

      // Активуємо вибраний
      btn.classList.add('tab-active');
      btn.setAttribute('aria-selected', 'true');
      const panel = qs(`[data-panel="${target}"]`, tabsWrapper);
      if (panel) {
        panel.style.display = '';
        panel.removeAttribute('hidden');
      }
    });
  });

  // Активуємо перший таб за замовчуванням
  if (tabBtns.length > 0) tabBtns[0].click();
}

/* ═══════════════════════════════════════════════════════════
   6. ВАЛІДАЦІЯ ФОРМИ CHECKOUT (checkout.html)
   Компонент: перевірка форми з виведенням повідомлень про помилки
═══════════════════════════════════════════════════════════ */

/**
 * Показати або приховати повідомлення про помилку для поля
 * @param {HTMLElement} input
 * @param {string|null} message — null = ховаємо
 */
function setFieldError(input, message) {
  // Видаляємо попереднє повідомлення
  const prev = input.parentElement.querySelector('.field-error-msg');
  if (prev) prev.remove();

  if (message) {
    input.style.borderColor = '#EF4444';
    input.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.15)';
    const msg = document.createElement('div');
    msg.className = 'field-error-msg';
    Object.assign(msg.style, {
      color: '#EF4444',
      fontSize: '11px',
      marginTop: '4px',
      fontWeight: '600',
    });
    msg.textContent = message;
    input.parentElement.appendChild(msg);
  } else {
    input.style.borderColor = '#00D8F6';
    input.style.boxShadow = '0 0 0 3px rgba(0,216,246,0.15)';
  }
}

/**
 * Валідація email
 * @param {string} val
 * @returns {boolean}
 */
function isValidEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

/**
 * Валідація ЄДРПОУ (8 цифр)
 * @param {string} val
 * @returns {boolean}
 */
function isValidEDRPOU(val) {
  return /^\d{8}$/.test(val.trim());
}

/**
 * Валідація телефону (мінімум 10 цифр)
 * @param {string} val
 * @returns {boolean}
 */
function isValidPhone(val) {
  return /^[\d\s\+\-\(\)]{10,}$/.test(val.trim());
}

function initCheckoutForm() {
  // B2C / B2B Toggle
  const optB2C   = qs('#type-b2c');
  const optB2B   = qs('#type-b2b');
  const b2bFields = qs('#b2b-company-fields');
  const invoiceSuccess = qs('#invoice-success-box');
  const btnSubmitInvoice = qs('#btn-submit-invoice');

  if (optB2C && optB2B && b2bFields) {
    optB2C.addEventListener('change', () => {
      if (optB2C.checked) {
        b2bFields.style.display = 'none';
        qsa('[data-b2b-required]', b2bFields).forEach(f => f.removeAttribute('required'));
      }
    });
    optB2B.addEventListener('change', () => {
      if (optB2B.checked) {
        b2bFields.style.display = 'grid';
        qsa('[data-b2b-required]', b2bFields).forEach(f => f.setAttribute('required', ''));
        Toast.show('B2B режим: заповніть реквізити компанії для безготівкового розрахунку', 'info');
      }
    });
  }

  // Валідація форми
  if (btnSubmitInvoice) {
    btnSubmitInvoice.addEventListener('click', async (e) => {
      e.preventDefault();

      let valid = true;

      // Email
      const emailInput = qs('#contact-email, input[type="email"]');
      if (emailInput) {
        if (!emailInput.value.trim()) {
          setFieldError(emailInput, 'Введіть адресу електронної пошти');
          valid = false;
        } else if (!isValidEmail(emailInput.value)) {
          setFieldError(emailInput, 'Невірний формат email (наприклад: name@company.com)');
          valid = false;
        } else {
          setFieldError(emailInput, null);
        }
      }

      // Телефон
      const phoneInput = qs('#contact-phone, input[type="tel"]');
      if (phoneInput && phoneInput.value.trim()) {
        if (!isValidPhone(phoneInput.value)) {
          setFieldError(phoneInput, 'Невірний формат телефону (мінімум 10 цифр)');
          valid = false;
        } else {
          setFieldError(phoneInput, null);
        }
      }

      // B2B: ЄДРПОУ
      if (optB2B && optB2B.checked) {
        const edrpouInput = qs('#edrpou, input[name="edrpou"]');
        if (edrpouInput) {
          if (!edrpouInput.value.trim()) {
            setFieldError(edrpouInput, 'ЄДРПОУ обов\'язковий для B2B замовлення');
            valid = false;
          } else if (!isValidEDRPOU(edrpouInput.value)) {
            setFieldError(edrpouInput, 'ЄДРПОУ повинен містити рівно 8 цифр');
            valid = false;
          } else {
            setFieldError(edrpouInput, null);
          }
        }

        // Назва компанії
        const companyInput = qs('#company-name, input[name="company"]');
        if (companyInput && !companyInput.value.trim()) {
          setFieldError(companyInput, 'Введіть назву компанії');
          valid = false;
        } else if (companyInput) {
          setFieldError(companyInput, null);
        }
      }

      if (!valid) {
        Toast.show('Будь ласка, виправте помилки у формі перед відправкою', 'error');
        return;
      }

      // Відправка замовлення до REST API (ЛР № 5)
      try {
        const orderPayload = {
          type: optB2B && optB2B.checked ? 'b2b' : 'b2c',
          email: emailInput ? emailInput.value.trim() : 'billing@opticlab.ua',
          phone: phoneInput ? phoneInput.value.trim() : '+380501234567',
          company_name: optB2B && optB2B.checked && qs('#company-name') ? qs('#company-name').value.trim() : 'ТОВ ОптікЛаб',
          edrpou: optB2B && optB2B.checked && qs('#edrpou') ? qs('#edrpou').value.trim() : '38492015',
          legal_address: '03056, м. Київ, просп. Берестейський, 37',
          items: [
            { sku: 'DW-50', name: 'Diffractive Waveguide DW-50 (RGB)', qty: 5, price_unit: 430.0 },
            { sku: 'OLED-071', name: 'Micro-OLED Display Module 0.71"', qty: 2, price_unit: 320.0 }
          ]
        };

        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });

        if (res.ok) {
          const resJson = await res.json();
          console.log('[OptiWave API] Замовлення збережено в БД SQLite:', resJson);
          if (invoiceSuccess && resJson.data) {
            const heading = invoiceSuccess.querySelector('h2');
            if (heading) heading.textContent = `✓ Рахунок-фактура № ${resJson.data.order_number} успішно збережена в БД!`;
          }
        }
      } catch (apiErr) {
        console.warn('[OptiWave API] Сервер недоступний або статичний режим:', apiErr.message);
      }

      // Успішне відправлення
      if (invoiceSuccess) {
        invoiceSuccess.style.display = 'block';
        invoiceSuccess.scrollIntoView({ behavior: 'smooth' });
        Toast.show('✅ Рахунок-фактуру сформовано! Очікуйте лист на email.', 'success', 5000);
      }
    });

    // Знімаємо помилку при введенні
    document.addEventListener('input', (e) => {
      if (e.target.closest('form') && e.target.style.borderColor === 'rgb(239, 68, 68)') {
        setFieldError(e.target, null);
      }
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   7. ВАЛІДАЦІЯ ФОРМИ CUSTOM ORDER (custom-order.html)
   Компонент: перевірка файлу та обов'язкових полів
═══════════════════════════════════════════════════════════ */

function initCustomOrderForm() {
  const customForm    = qs('#custom-order-form');
  const customSuccess = qs('#custom-success-box');
  const fileInput     = qs('#cad-file-input, input[type="file"]');
  const fileDropzone  = qs('#cad-dropzone, .file-dropzone');

  // Drag & Drop для файлів
  if (fileDropzone && fileInput) {
    ['dragenter', 'dragover'].forEach(evt => {
      fileDropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        fileDropzone.style.borderColor = '#00D8F6';
        fileDropzone.style.background = 'rgba(0, 216, 246, 0.05)';
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      fileDropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        fileDropzone.style.borderColor = '';
        fileDropzone.style.background = '';
      });
    });

    fileDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFileSelect(files[0]);
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) handleFileSelect(fileInput.files[0]);
    });
  }

  /**
   * Перевірка завантаженого файлу
   * @param {File} file
   */
  function handleFileSelect(file) {
    const allowedExts = ['.step', '.stp', '.dxf', '.pdf'];
    const maxSize = 25 * 1024 * 1024; // 25 MB
    const fileName = file.name.toLowerCase();
    const isAllowed = allowedExts.some(ext => fileName.endsWith(ext));

    if (!isAllowed) {
      Toast.show(`Формат файлу не підтримується. Дозволені: ${allowedExts.join(', ')}`, 'error', 5000);
      if (fileInput) fileInput.value = '';
      return;
    }

    if (file.size > maxSize) {
      Toast.show(`Файл занадто великий: ${(file.size / 1024 / 1024).toFixed(1)} МБ. Максимум: 25 МБ`, 'error', 5000);
      if (fileInput) fileInput.value = '';
      return;
    }

    Toast.show(`Файл «${file.name}» (${(file.size / 1024).toFixed(0)} КБ) готовий до відправки`, 'success', 3000);

    // Оновлюємо інформацію в дропзоні
    if (fileDropzone) {
      const info = qs('.dropzone-info', fileDropzone) || fileDropzone;
      info.innerHTML = `📎 <strong>${file.name}</strong><br><span style="font-size:11px;color:#94A3B8;">${(file.size/1024).toFixed(0)} КБ · Готово</span>`;
    }
  }

  // Валідація та відправка форми
  if (customForm && customSuccess) {
    customForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      let valid = true;
      const requiredFields = qsa('[required]', customForm);

      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          setFieldError(field, 'Це поле є обов\'язковим');
          valid = false;
        } else {
          setFieldError(field, null);
        }
      });

      // Email в custom form
      const emailField = qs('input[type="email"]', customForm);
      if (emailField && emailField.value.trim() && !isValidEmail(emailField.value)) {
        setFieldError(emailField, 'Невірний формат email');
        valid = false;
      }

      if (!valid) {
        Toast.show('Заповніть усі обов\'язкові поля форми', 'error');
        return;
      }

      // Відправка до REST API /api/custom-requests (ЛР № 5)
      try {
        const payload = {
          wave_type: qs('input[name="wave-type"]:checked')?.parentElement?.textContent?.trim() || 'Поверхневий рельєф (SRG)',
          spectrum: qs('input[name="spectrum"]:checked')?.parentElement?.textContent?.trim() || 'RGB Повний спектр',
          target_fov: qs('input[value*="52°"]')?.value || '52° Diagonal',
          material: qs('select')?.value || 'Плавлений кварц (Fused Silica 1.2 мм)',
          quantity_tier: qs('input[name="qty"]:checked')?.parentElement?.textContent?.trim() || '5 — 10 шт',
          contact_name: qs('input[value*="Ковальов"]')?.value || 'Ковальов Андрій Олександрович',
          company: qs('input[value*="ОптікЛаб"]')?.value || 'ТОВ ОптікЛаб Текнолоджіз',
          email: emailField ? emailField.value.trim() : 'engineer@opticlab.ua',
          notes: qs('textarea')?.value || '',
          file_name: 'optical_waveguide_housing_v3.step',
          file_size_kb: 14500
        };

        const res = await fetch('/api/custom-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const resJson = await res.json();
          console.log('[OptiWave API] Кастомна заявка збережена в БД:', resJson);
          if (customSuccess && resJson.request_number) {
            const h = customSuccess.querySelector('h2');
            if (h) h.textContent = `✓ Заявку на інженерний розрахунок № ${resJson.request_number} успішно збережено в БД!`;
          }
        }
      } catch (apiErr) {
        console.warn('[OptiWave API] Сервер недоступний або локальний файл:', apiErr.message);
      }

      customSuccess.style.display = 'block';
      customSuccess.scrollIntoView({ behavior: 'smooth' });
      Toast.show('✅ Запит на кастомний компонент відправлено! Відповідь протягом 24 год.', 'success', 5000);
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   8. COMPARISON TABLE (compare.html)
   Компонент: підсвітка відмінностей + очищення + інтерактивні рядки
═══════════════════════════════════════════════════════════ */

function initComparison() {
  // Підсвітка відмінностей
  const diffToggle = qs('#diff-toggle');
  if (diffToggle) {
    diffToggle.addEventListener('change', () => {
      const diffRows = qsa('.comparison-table tr[data-diff="true"]');
      diffRows.forEach(row => {
        row.style.transition = 'background-color 0.3s ease';
        row.style.backgroundColor = diffToggle.checked ? 'rgba(0,216,246,0.08)' : '#FFFFFF';
      });
      Toast.show(
        diffToggle.checked ? '🔍 Відмінності підсвічено' : 'Підсвітка відмінностей вимкнена',
        'info', 2000
      );
    });
  }

  // Очищення таблиці
  const btnClearComp = qs('#btn-clear-comp');
  if (btnClearComp) {
    btnClearComp.addEventListener('click', () => {
      if (confirm('Очистити всі товари з порівняння?')) {
        const table = qs('.comparison-table');
        if (table) {
          table.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:40px;color:#64748B;">
            Список порівняння порожній. Перейдіть до <a href="catalog.html" style="color:#0284C7;font-weight:600;">каталогу</a>, щоб додати товари.
          </td></tr>`;
        }
        Toast.show('Таблиця порівняння очищена', 'info', 2000);
      }
    });
  }

  // Hover-підсвітка стовпця при hover
  const compTable = qs('.comparison-table');
  if (compTable) {
    compTable.addEventListener('mouseover', (e) => {
      const cell = e.target.closest('td, th');
      if (!cell) return;
      const colIdx = cell.cellIndex;
      if (colIdx === 0) return; // перший стовпець — ярлики

      qsa('tr', compTable).forEach(row => {
        const c = row.cells[colIdx];
        if (c) c.style.backgroundColor = 'rgba(0,216,246,0.04)';
      });
    });

    compTable.addEventListener('mouseout', (e) => {
      const cell = e.target.closest('td, th');
      if (!cell) return;
      const colIdx = cell.cellIndex;

      qsa('tr', compTable).forEach(row => {
        const c = row.cells[colIdx];
        if (c) {
          c.style.backgroundColor = row.dataset.diff === 'true' && diffToggle && diffToggle.checked
            ? 'rgba(0,216,246,0.08)'
            : '';
        }
      });
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   9. ACCORDION / FAQ
   Компонент: розгортання блоків без перезавантаження
═══════════════════════════════════════════════════════════ */

function initAccordion() {
  const accordions = qsa('[data-accordion]');
  accordions.forEach(acc => {
    const trigger = qs('[data-accordion-trigger]', acc);
    const content = qs('[data-accordion-content]', acc);
    if (!trigger || !content) return;

    trigger.setAttribute('aria-expanded', 'false');
    content.style.display = 'none';

    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';

      // Закрити всі інші в тому ж контейнері
      const parent = acc.parentElement;
      qsa('[data-accordion]', parent).forEach(other => {
        const otherTrigger = qs('[data-accordion-trigger]', other);
        const otherContent = qs('[data-accordion-content]', other);
        if (otherTrigger && otherContent && other !== acc) {
          otherTrigger.setAttribute('aria-expanded', 'false');
          otherContent.style.display = 'none';
        }
      });

      // Переключити поточний
      trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      content.style.display = isOpen ? 'none' : 'block';
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   10. SCROLL TO TOP BUTTON
   Компонент: інтерактивна кнопка прокрутки вгору
═══════════════════════════════════════════════════════════ */

function initScrollToTop() {
  const btn = document.createElement('button');
  btn.id = 'scroll-top-btn';
  btn.setAttribute('aria-label', 'Вгору');
  btn.textContent = '↑';
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '90px',
    right: '24px',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: '#0B192C',
    color: '#00D8F6',
    border: '1px solid #00D8F6',
    fontSize: '20px',
    cursor: 'pointer',
    zIndex: '999',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: 'opacity 0.3s ease',
    fontFamily: 'Inter, sans-serif',
  });
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 300 ? 'flex' : 'none';
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ═══════════════════════════════════════════════════════════
   11. API HEALTH CHECK (ЛР № 5: Вайбкодинг)
   Компонент: індикатор зв'язку клієнта з сервером та базою даних
═══════════════════════════════════════════════════════════ */

async function checkApiHealth() {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      const actions = qs('.header-actions');
      if (actions && !qs('#api-status-badge')) {
        const badge = document.createElement('span');
        badge.id = 'api-status-badge';
        badge.className = 'badge badge-green';
        badge.style.display = 'inline-flex';
        badge.style.alignItems = 'center';
        badge.style.gap = '4px';
        badge.style.fontSize = '11px';
        badge.innerHTML = `🟢 API Online`;
        actions.prepend(badge);
      }
      console.log('[OptiWave] REST API & SQLite DB підключено:', data);
    }
  } catch (e) {
    // Тихо ігноруємо при перегляді через file:///
  }
}

/* ═══════════════════════════════════════════════════════════
   ІНІЦІАЛІЗАЦІЯ — DOMContentLoaded
═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Мобільне меню
  initMobileNav();

  // 2. Toast (ініціалізуємо превентивно)
  Toast.init();

  // 3. Кошик
  Cart.init();

  // 4. Фільтрація каталогу
  initCatalogFilters();

  // 5. Tabs на головній
  initHomeTabs();

  // 6. Валідація checkout
  initCheckoutForm();

  // 7. Валідація custom-order
  initCustomOrderForm();

  // 8. Comparison
  initComparison();

  // 9. Accordion
  initAccordion();

  // 10. Scroll to top
  initScrollToTop();

  // 11. API Health Check (ЛР № 5)
  checkApiHealth();

  // Додаємо data-атрибути до кнопок "В кошик" (для Cart.add)
  qsa('.btn-primary').forEach(btn => {
    if (btn.textContent.includes('кошик')) {
      const card = btn.closest('.product-card');
      const title = card ? (qs('h3', card) || { textContent: 'Товар' }).textContent.trim() : 'Товар';
      btn.dataset.addToCart = title;
      btn.removeAttribute('href'); // Знімаємо перехід, обробляємо через Cart
    }
  });

  console.log('[OptiWave] JS Module v2.0 ініціалізовано. Усі компоненти активні.');
});
