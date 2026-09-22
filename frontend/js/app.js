/**
 * DULCE VICIO - Pastelería Artesanal
 * Aplicación principal de Frontend: UI, Interacciones, Modales y Ley 24.240
 */

import { DulceVicioAPI } from './api.js';
import { cart } from './cart.js';

let currentProducts = [];
let activeCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setupEventListeners();
  setupCartDrawer();
  setupLey24240();
  await loadCatalog();
  renderCartUI();
}

/**
 * Carga de productos desde el backend o fallback
 */
async function loadCatalog() {
  const container = document.getElementById('products-grid');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
      <div style="font-size: 2rem; animation: spin 1s linear infinite; display: inline-block;">🍰</div>
      <p style="margin-top: 10px; font-weight: 600;">Cargando postres artesanales de Dulce Vicio...</p>
    </div>
  `;

  const searchVal = document.getElementById('search-input')?.value || "";
  currentProducts = await DulceVicioAPI.getProductos({ nombre: searchVal });
  renderProducts();
}

/**
 * Renderiza tarjetas de productos en el grid
 */
function renderProducts() {
  const container = document.getElementById('products-grid');
  if (!container) return;

  const filtered = activeCategory === 'all'
    ? currentProducts
    : currentProducts.filter(p => p.categoria === activeCategory);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🧁🔍</div>
        <h3>No encontramos ese postre en el menú</h3>
        <p>Probá buscando otro término o mirá nuestros destacados virales.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const formattedPrice = Number(p.precio_final).toLocaleString("es-AR");
    const cuotasVal = p.cuotas_valor ? Number(p.cuotas_valor).toLocaleString("es-AR") : (p.precio_final / 3).toLocaleString("es-AR");
    const viralTag = p.viral_tag || "Viral en TikTok 🔥";

    return `
      <article class="product-card" data-id="${p.id}">
        <div class="product-media-container">
          <img class="product-card-img" src="${p.imagen_url || 'assets/images/logo.svg'}" alt="${p.nombre}" loading="lazy" />
          <div class="product-badge-viral">
            <span>✨</span> ${viralTag}
          </div>
          <div class="product-stock-tag">
            Stock: ${p.stock} un.
          </div>
        </div>

        <div class="product-content">
          <span class="product-category-name">${p.categoria || 'Pastelería'}</span>
          <h3 class="product-title">${p.nombre}</h3>
          <p class="product-desc">${p.descripcion || 'Elaborado artesanalmente con ingredientes de primera selección.'}</p>

          <div class="product-pricing-box">
            <div class="product-price-final">
              <span class="price-currency">$</span>
              <span class="price-amount">${formattedPrice}</span>
            </div>
            <div class="cuotas-highlight">
              <span>💳</span> 3 cuotas sin interés de $${cuotasVal}
            </div>
            <div class="warranty-info">
              🛡️ Garantía legal y frescura: ${p.garantia_meses || 1} mes (Ley 24.240)
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-add-cart" onclick="window.handleAddToCart(${p.id})">
              <span>🛒</span> Agregar al Carrito
            </button>
            <button class="btn-quick-view" onclick="window.handleQuickView(${p.id})" title="Ver detalle del postre">
              👁️
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Handlers globales expuestos a los botones inline
 */
window.handleAddToCart = function(productId) {
  const prod = currentProducts.find(p => p.id === productId);
  if (prod) {
    cart.addItem(prod);
    showToast(`¡${prod.nombre} agregado al carrito! 🍰`);
  }
};

window.handleQuickView = function(productId) {
  const prod = currentProducts.find(p => p.id === productId);
  if (!prod) return;

  const modal = document.getElementById('product-detail-modal');
  const body = document.getElementById('product-modal-body');
  if (!modal || !body) return;

  const cuotasVal = prod.cuotas_valor ? Number(prod.cuotas_valor).toLocaleString("es-AR") : (prod.precio_final / 3).toLocaleString("es-AR");

  body.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <div style="border-radius: var(--radius-md); overflow: hidden; max-height: 280px;">
        <img src="${prod.imagen_url}" alt="${prod.nombre}" style="width: 100%; height: 280px; object-fit: cover;" />
      </div>
      <div>
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
          <h2 style="font-size: 2rem;">${prod.nombre}</h2>
          <span style="font-family: 'Outfit'; font-size: 1.8rem; font-weight: 800; color: var(--primary);">
            $${Number(prod.precio_final).toLocaleString("es-AR")}
          </span>
        </div>
        <div style="color: var(--caramel); font-weight: 700; font-size: 0.9rem; margin-bottom: 12px;">
          Categoría: ${prod.categoria || 'Pastelería'} | Stock disponible: ${prod.stock} u.
        </div>
        <p style="color: var(--text-muted); font-size: 1rem; line-height: 1.6; margin-bottom: 20px;">
          ${prod.descripcion}
        </p>

        <div style="background: #faf5f0; border-radius: var(--radius-sm); padding: 16px; margin-bottom: 24px;">
          <h4 style="font-size: 0.95rem; margin-bottom: 8px;">✨ Beneficios de Compra & Derechos del Consumidor:</h4>
          <ul style="font-size: 0.85rem; color: var(--text-muted); list-style: none; display: flex; flex-direction: column; gap: 6px;">
            <li>💳 <strong>Hasta 3 cuotas fijas</strong> de $${cuotasVal} sin recargo.</li>
            <li>🛡️ <strong>Garantía de calidad:</strong> ${prod.garantia_meses || 1} mes de frescura garantizada.</li>
            <li>↩️ <strong>Ley 24.240 (Art. 34):</strong> 10 días para revocar la compra online sin costo alguno.</li>
          </ul>
        </div>

        <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="window.handleAddToCart(${prod.id}); window.closeModals();">
          🛒 Agregar al pedido por $${Number(prod.precio_final).toLocaleString("es-AR")}
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
};

/**
 * Configura el Carrito Lateral y UI
 */
function setupCartDrawer() {
  const toggleBtn = document.getElementById('btn-open-cart');
  const closeBtn = document.getElementById('btn-close-cart');
  const overlay = document.getElementById('cart-overlay');
  const drawer = document.getElementById('cart-drawer');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      drawer?.classList.add('active');
      overlay?.classList.add('active');
    });
  }

  const closeCart = () => {
    drawer?.classList.remove('active');
    overlay?.classList.remove('active');
  };

  closeBtn?.addEventListener('click', closeCart);
  overlay?.addEventListener('click', closeCart);

  cart.subscribe(() => {
    renderCartUI();
  });
}

function renderCartUI() {
  const countEl = document.getElementById('cart-badge-count');
  const itemsContainer = document.getElementById('cart-items-list');
  const subtotalEl = document.getElementById('cart-subtotal-amount');
  const cuotasInfoEl = document.getElementById('cart-cuotas-text');

  const count = cart.getCount();
  const total = cart.getTotal();

  if (countEl) countEl.textContent = count;

  if (!itemsContainer) return;

  if (cart.items.length === 0) {
    itemsContainer.innerHTML = `
      <div class="empty-cart-view">
        <div class="empty-cart-icon">🛍️</div>
        <h4>Tu carrito está vacío</h4>
        <p>Agregá alguno de nuestros postres virales para disfrutar del mejor vicio dulce.</p>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = "$0";
    if (cuotasInfoEl) cuotasInfoEl.textContent = "3 cuotas sin interés de $0";
    return;
  }

  itemsContainer.innerHTML = cart.items.map(item => `
    <div class="cart-item">
      <img src="${item.imagen_url}" alt="${item.nombre}" class="cart-item-img" />
      <div class="cart-item-details">
        <div class="cart-item-title">${item.nombre}</div>
        <div class="cart-item-price">$${Number(item.precio_final * item.quantity).toLocaleString("es-AR")}</div>
        <div class="cart-item-qty-controls">
          <button class="btn-qty" onclick="window.changeCartQty(${item.id}, -1)">-</button>
          <span style="font-weight: 700; font-size: 0.9rem;">${item.quantity}</span>
          <button class="btn-qty" onclick="window.changeCartQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="btn-remove-item" onclick="window.removeCartItem(${item.id})" title="Eliminar">🗑️</button>
    </div>
  `).join('');

  const formattedTotal = Number(total).toLocaleString("es-AR");
  const cuotaTotal = (total / 3).toLocaleString("es-AR", { maximumFractionDigits: 2 });

  if (subtotalEl) subtotalEl.textContent = `$${formattedTotal}`;
  if (cuotasInfoEl) cuotasInfoEl.textContent = `💳 Hasta 3 cuotas sin interés de $${cuotaTotal}`;
}

window.changeCartQty = function(id, delta) {
  cart.updateQuantity(id, delta);
};

window.removeCartItem = function(id) {
  cart.removeItem(id);
};

/**
 * Event Listeners generales
 */
function setupEventListeners() {
  // Buscador en tiempo real con debounce
  const searchInput = document.getElementById('search-input');
  let debounceTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        loadCatalog();
      }, 300);
    });
  }

  // Filtro de categorías
  const filterBtns = document.querySelectorAll('.btn-filter');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeCategory = e.target.dataset.category || 'all';
      renderProducts();
    });
  });

  // Modal checkout
  const btnCheckout = document.getElementById('btn-checkout');
  btnCheckout?.addEventListener('click', () => {
    if (cart.items.length === 0) {
      showToast('⚠️ Agregá productos antes de iniciar la compra');
      return;
    }
    document.getElementById('cart-drawer')?.classList.remove('active');
    document.getElementById('cart-overlay')?.classList.remove('active');
    openCheckoutModal();
  });
}

/**
 * Configuración de la Ley 24.240 y Botón de Arrepentimiento
 */
function setupLey24240() {
  // Botones para abrir modal informativo
  const openInfoBtns = document.querySelectorAll('.trigger-ley24240-info');
  const infoModal = document.getElementById('ley24240-info-modal');

  openInfoBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      infoModal?.classList.add('active');
    });
  });

  // Botones para abrir formulario del Botón de Arrepentimiento
  const openArrepentimientoBtns = document.querySelectorAll('.trigger-arrepentimiento');
  const arrepentimientoModal = document.getElementById('arrepentimiento-modal');

  openArrepentimientoBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      arrepentimientoModal?.classList.add('active');
    });
  });

  // Formulario de arrepentimiento
  const form = document.getElementById('form-arrepentimiento');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pedidoId = document.getElementById('arrepentimiento-pedido-id').value;
    const email = document.getElementById('arrepentimiento-email').value;
    const motivo = document.getElementById('arrepentimiento-motivo').value;

    const btnSubmit = form.querySelector('button[type="submit"]');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Procesando revocación...';
    }

    const resultado = await DulceVicioAPI.solicitarArrepentimiento({
      pedido_id: pedidoId,
      email,
      motivo
    });

    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Confirmar Arrepentimiento de Compra';
    }

    // Mostrar resultado de trámite
    const body = document.getElementById('arrepentimiento-modal-body');
    if (body) {
      body.innerHTML = `
        <div style="text-align: center; padding: 20px 10px;">
          <div style="font-size: 3.5rem; margin-bottom: 12px;">✅</div>
          <h3 style="font-size: 1.5rem; color: var(--choco-dark); margin-bottom: 8px;">
            Revocación Registrada con Éxito
          </h3>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">
            Conforme al Art. 34 de la Ley 24.240 y la Res. 424/2020, hemos generado tu código oficial de trámite:
          </p>
          <div style="background: #fdf2f8; border: 2px dashed var(--primary); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 20px;">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">CÓDIGO DE TRÁMITE / ARREPENTIMIENTO:</div>
            <div style="font-family: 'Outfit'; font-size: 1.8rem; font-weight: 900; color: var(--primary);">${resultado.codigo_tramite}</div>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 24px;">
            Te enviamos una copia a <strong>${resultado.email_notificacion}</strong>. Nuestro equipo se contactará dentro de las próximas 24 hs hábiles para gestionar el reintegro total del 100% sin ningún costo de devolución.
          </p>
          <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="window.closeModals()">
            Entendido
          </button>
        </div>
      `;
    }
  });
}

function openCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  const body = document.getElementById('checkout-modal-body');
  if (!modal || !body) return;

  const total = cart.getTotal();
  const cuotasInfo = cart.getInstallmentsInfo(3);

  body.innerHTML = `
    <h3 style="font-size: 1.8rem; margin-bottom: 16px;">Finalizar Pedido Artesanal 🍰</h3>
    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">
      Completá tus datos para que preparemos tu pedido recién horneado con entrega inmediata.
    </p>

    <div style="background: #faf6f3; padding: 16px; border-radius: var(--radius-sm); margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.1rem; margin-bottom: 4px;">
        <span>Total a pagar:</span>
        <span style="color: var(--primary);">$${Number(total).toLocaleString("es-AR")}</span>
      </div>
      <div style="font-size: 0.85rem; color: #059669; font-weight: 700;">
        ${cuotasInfo.texto}
      </div>
    </div>

    <form id="checkout-form">
      <div class="form-group">
        <label class="form-label">Nombre y Apellido</label>
        <input type="text" class="form-control" required placeholder="Ej: Sofía Martínez" id="cust-name" />
      </div>
      <div class="form-group">
        <label class="form-label">WhatsApp / Teléfono (para avisarte cuando esté listo)</label>
        <input type="tel" class="form-control" required placeholder="Ej: +54 9 11 2345-6789" id="cust-phone" />
      </div>
      <div class="form-group">
        <label class="form-label">Correo Electrónico</label>
        <input type="email" class="form-control" required placeholder="tu-email@gmail.com" id="cust-email" />
      </div>
      <div class="form-group">
        <label class="form-label">Dirección de Entrega</label>
        <input type="text" class="form-control" required placeholder="Calle, número y piso" id="cust-address" />
      </div>

      <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 20px; line-height: 1.4;">
        🔒 Al comprar aceptas nuestros términos conforme a la <strong>Ley 24.240</strong>. Cuentas con 10 días para revocar tu compra online a través del Botón de Arrepentimiento.
      </div>

      <button type="submit" class="btn-primary" style="width: 100%; justify-content: center;">
        Confirmar y Recibir en Casa ✨
      </button>
    </form>
  `;

  document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cust-name').value;
    const email = document.getElementById('cust-email').value;
    const phone = document.getElementById('cust-phone').value;

    const order = cart.createOrder({ name, email, phone });
    showOrderConfirmation(order);
  });

  modal.classList.add('active');
}

function showOrderConfirmation(order) {
  const body = document.getElementById('checkout-modal-body');
  if (!body) return;

  body.innerHTML = `
    <div style="text-align: center; padding: 20px 10px;">
      <div style="font-size: 4rem; margin-bottom: 12px;">🎉🎂</div>
      <h3 style="font-size: 1.8rem; margin-bottom: 8px;">¡Tu antojo dulce está en camino!</h3>
      <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 20px;">
        Muchas gracias por elegir la pastelería artesanal de <strong>Dulce Vicio</strong>.
      </p>

      <div style="background: #faf6f3; padding: 20px; border-radius: var(--radius-md); text-align: left; margin-bottom: 24px;">
        <div style="font-weight: 800; font-size: 1.1rem; margin-bottom: 8px;">
          Número de Pedido: <span style="color: var(--primary);">#${order.orderId}</span>
        </div>
        <div style="font-size: 0.88rem; color: var(--text-muted);">
          Total: <strong>$${Number(order.total).toLocaleString("es-AR")}</strong><br/>
          Cliente: <strong>${order.customer.name}</strong> (${order.customer.email})<br/>
          Fecha: <strong>${new Date().toLocaleDateString("es-AR")}</strong>
        </div>
      </div>

      <div style="background: #fff8eb; border: 1px solid #fde68a; padding: 14px; border-radius: var(--radius-sm); font-size: 0.82rem; color: #92400e; margin-bottom: 24px; text-align: left;">
        📌 <strong>Recordatorio Ley 24.240:</strong> Guarda tu número de pedido <strong>#${order.orderId}</strong>. Conforme al Art. 34, puedes utilizar el <strong>Botón de Arrepentimiento</strong> en cualquier momento dentro de los próximos 10 días corridos.
      </div>

      <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="window.closeModals()">
        Volver a la Tienda
      </button>
    </div>
  `;
}

window.closeModals = function() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
};

function showToast(message) {
  const toast = document.getElementById('toast-msg');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3200);
}
