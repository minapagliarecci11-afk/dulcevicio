import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useCarrito } from '../context/CarritoContext';

export function Catalogo({ onOpenCart }) {
  const [productos, setProductos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('all');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const { agregarItem } = useCarrito();

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async (filtroNombre = '') => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.productos.listar({ nombre: filtroNombre });
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e) => {
    const val = e.target.value;
    setBusqueda(val);
    cargarProductos(val);
  };

  const productosFiltrados = categoriaActiva === 'all'
    ? productos
    : productos.filter(p => p.categoria === categoriaActiva);

  return (
    <main>
      {/* Hero Section */}
      <section className="hero-section" id="inicio">
        <div className="hero-grid">
          <div className="hero-text-content">
            <div className="hero-badge-container">
              <span>✨</span>
              <span className="hero-badge-text">EL GUSTO QUE LE DEBÍAMOS A LA CIUDAD</span>
            </div>
            <h1 className="hero-title">
              Pastelería <span className="highlight">artesanal</span> que se vuelve tu vicio favorito.
            </h1>
            <p className="hero-description">
              <strong>Dulce Vicio</strong> nace del deseo genuino de compartir pastelería real y darle un gusto a nuestra ciudad. Creado para los amantes de las texturas intensas, chocolate y recetas virales.
            </p>
            <div className="hero-cta-group">
              <a href="#menu-productos" className="btn-primary" id="hero-btn-pedir">
                <span>🍰</span> Ver Menú & Pedir Ahora
              </a>
              <a href="#ley-consumidor" className="btn-secondary">
                <span>🛡️</span> Ley 24.240 y Garantías
              </a>
            </div>
          </div>
          <div className="hero-media-wrapper">
            <div className="hero-showcase-card">
              <img src="/assets/images/tiramisu.jpg" alt="Tiramisú Artesanal" className="hero-showcase-img" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600'; }} />
              <div className="hero-floating-badge">
                <span>🔥</span> #1 Más Vendido en TikTok
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tira de Beneficios */}
      <section className="benefits-strip">
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">💳</div>
            <div className="benefit-info">
              <h4>Hasta 3 Cuotas</h4>
              <p>Comprá tus postres en cuotas sin interés con todas las tarjetas.</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">⏱️</div>
            <div className="benefit-info">
              <h4>Envío Rápido y Fresco</h4>
              <p>Horneamos en el día para que te llegue con frescura total.</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🛡️</div>
            <div className="benefit-info">
              <h4>Garantía Ley 24.240</h4>
              <p>Garantía de calidad, frescura y trato digno al consumidor.</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">↩️</div>
            <div className="benefit-info">
              <h4>Arrepentimiento 10 Días</h4>
              <p>Derecho de revocación online según Art. 34 y Res. 424/2020.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo de Productos */}
      <section className="catalog-section" id="menu-productos">
        <div className="section-header">
          <span className="section-badge">Nuestra Carta Artesanal</span>
          <h2 className="section-title">Elegí tu próximo Dulce Vicio</h2>
          <p className="section-subtitle">
            Elaborados desde cero, con ingredientes seleccionados y precios justos y transparentes.
          </p>
        </div>

        <div className="catalog-controls">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              value={busqueda}
              onChange={handleBuscar}
              placeholder="Buscar tiramisú, brownie, cookie, flan..."
            />
          </div>

          <div className="filter-categories">
            {['all', 'Favoritos Argentinos', 'Chocolatería', 'Postres Fríos', 'Cookies & Bocados', 'Pastelería'].map(cat => (
              <button
                key={cat}
                className={`btn-filter ${categoriaActiva === cat ? 'active' : ''}`}
                onClick={() => setCategoriaActiva(cat)}
              >
                {cat === 'all' ? 'Todos los Postres' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Estados de Carga, Error y Vacío */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>🍰</div>
            <p style={{ marginTop: '12px', fontWeight: 600 }}>Cargando postres artesanales de Dulce Vicio...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ maxWidth: '600px', margin: '30px auto', padding: '20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
            <h4 style={{ color: '#991b1b', marginBottom: '6px' }}>Error al conectar con el catálogo</h4>
            <p style={{ color: '#b91c1c', fontSize: '0.9rem', marginBottom: '14px' }}>{error}</p>
            <button className="btn-secondary" onClick={() => cargarProductos(busqueda)}>Reintentar</button>
          </div>
        )}

        {!loading && !error && productosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🧁🔍</div>
            <h3>No encontramos ese postre en el menú</h3>
            <p>Probá buscando otro término o seleccionando otra categoría.</p>
          </div>
        )}

        {/* Grid de Productos */}
        {!loading && !error && productosFiltrados.length > 0 && (
          <div className="products-grid">
            {productosFiltrados.map(p => {
              const formattedPrice = Number(p.precio_final).toLocaleString('es-AR');
              const cuotasVal = p.cuotas_valor ? Number(p.cuotas_valor).toLocaleString('es-AR') : (p.precio_final / 3).toLocaleString('es-AR');

              return (
                <article key={p.id} className="product-card">
                  <div className="product-media-container">
                    <img
                      className="product-card-img"
                      src={p.imagen_url || '/assets/images/logo.svg'}
                      alt={p.nombre}
                      loading="lazy"
                      onError={(e) => { e.target.src = '/assets/images/logo.svg'; }}
                    />
                    <div className="product-badge-viral">
                      <span>✨</span> Artesanal 🍰
                    </div>
                    <div className="product-stock-tag">
                      Stock: {p.stock} un.
                    </div>
                  </div>

                  <div className="product-content">
                    <span className="product-category-name">{p.categoria || 'Pastelería'}</span>
                    <h3 className="product-title">{p.nombre}</h3>
                    <p className="product-desc">{p.descripcion || 'Elaborado artesanalmente con ingredientes de primera selección.'}</p>

                    <div className="product-pricing-box">
                      <div className="product-price-final">
                        <span className="price-currency">$</span>
                        <span className="price-amount">{formattedPrice}</span>
                      </div>
                      <div className="cuotas-highlight">
                        <span>💳</span> 3 cuotas fijas de ${cuotasVal}
                      </div>
                      <div className="warranty-info">
                        🛡️ Garantía: {p.garantia_meses || 1} mes (Ley 24.240)
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        className="btn-add-cart"
                        onClick={() => { agregarItem(p); onOpenCart(); }}
                        disabled={p.stock <= 0}
                      >
                        <span>🛒</span> {p.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                      </button>
                      <button
                        className="btn-quick-view"
                        onClick={() => setProductoSeleccionado(p)}
                        title="Ver detalle del postre"
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Rápido de Detalle */}
      {productoSeleccionado && (
        <div className="modal-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content-card" style={{ maxWidth: '580px', width: '90%', padding: '24px' }}>
            <button className="modal-close-btn" onClick={() => setProductoSeleccionado(null)}>✕</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderRadius: '12px', overflow: 'hidden', maxHeight: '240px' }}>
                <img
                  src={productoSeleccionado.imagen_url || '/assets/images/logo.svg'}
                  alt={productoSeleccionado.nombre}
                  style={{ width: '100%', height: '240px', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = '/assets/images/logo.svg'; }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--choco-dark)' }}>{productoSeleccionado.nombre}</h2>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Outfit' }}>
                  ${Number(productoSeleccionado.precio_final).toLocaleString('es-AR')}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                {productoSeleccionado.descripcion}
              </p>
              <div style={{ background: '#faf6f3', padding: '14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div>💳 <strong>3 cuotas fijas sin interés</strong> con todas las tarjetas.</div>
                <div>🛡️ <strong>Garantía legal y frescura:</strong> {productoSeleccionado.garantia_meses || 1} mes.</div>
                <div>↩️ <strong>Derecho de arrepentimiento:</strong> 10 días corridos bajo Ley 24.240.</div>
              </div>
              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  agregarItem(productoSeleccionado);
                  setProductoSeleccionado(null);
                  onOpenCart();
                }}
              >
                🛒 Agregar al Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
