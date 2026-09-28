import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';

export function Navbar({ onOpenCart }) {
  const { user, esAdmin, logout } = useAuth();
  const { cantidadTotal } = useCarrito();
  const navigate = useNavigate();

  return (
    <>
      {/* 1. Barra Superior Legal: Ley 24.240 y Botón de Arrepentimiento */}
      <div className="top-notice-bar" id="top-legal-bar">
        <div className="ticker-content">
          <span className="badge-tag">TRENDING EN TIKTOK 🔥</span>
          <span>¡Envío express a toda la ciudad en pedidos de hoy! 🛵</span>
        </div>
        <div className="top-actions">
          <Link to="/#ley-consumidor" className="link-ley24240">
            🛡️ Ley 24.240 de Defensa del Consumidor
          </Link>
          <Link to="/arrepentimiento" className="btn-arrepentimiento-top" title="Botón de Arrepentimiento conforme a Res. 424/2020">
            ↩️ Botón de Arrepentimiento
          </Link>
        </div>
      </div>

      {/* 2. Barra de Navegación Principal */}
      <header className="navbar" id="main-navbar">
        <div className="nav-container">
          <Link to="/" className="brand-logo" id="nav-brand-logo">
            <span style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.8rem', color: 'var(--choco-dark)' }}>
              Dulce<span style={{ color: 'var(--primary)' }}>Vicio</span>
            </span>
          </Link>

          <ul className="nav-links">
            <li><Link to="/" className="nav-item">Inicio</Link></li>
            <li><a href="/#menu-productos" className="nav-item">Carta de Postres</a></li>
            <li><Link to="/arrepentimiento" className="nav-item" style={{ color: 'var(--primary)', fontWeight: 700 }}>Arrepentimiento</Link></li>
            {user && <li><Link to="/mis-datos" className="nav-item">Mis Datos (Ley 25.326)</Link></li>}
            {esAdmin && <li><Link to="/admin" className="nav-item" style={{ color: '#0284c7', fontWeight: 800 }}>⚙️ Admin Catálogo</Link></li>}
          </ul>

          <div className="nav-actions">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--choco-dark)' }}>
                  👤 {user.nombre.split(' ')[0]}
                </span>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  style={{ background: 'none', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  Salir
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to="/login" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Ingresar
                </Link>
                <Link to="/register" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Registrarse
                </Link>
              </div>
            )}

            <button className="btn-cart-toggle" onClick={onOpenCart} aria-label="Abrir Carrito de Compras">
              🛒
              <span className="cart-counter" id="cart-badge-count">{cantidadTotal}</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
