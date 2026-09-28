import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';

export function CartDrawer({ isOpen, onClose }) {
  const { items, total, actualizarCantidad, eliminarItem, getInstallmentsInfo } = useCarrito();
  const navigate = useNavigate();
  const cuotasInfo = getInstallmentsInfo(3);

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-drawer-overlay active" onClick={onClose}></div>
      <aside className="cart-drawer active" aria-label="Carrito de compras">
        <div className="cart-header">
          <h3><span>🛍️</span> Tu Pedido</h3>
          <button className="btn-close-drawer" onClick={onClose} aria-label="Cerrar carrito">✕</button>
        </div>

        <div className="cart-items-container">
          {items.length === 0 ? (
            <div className="empty-cart-view">
              <div className="empty-cart-icon">🛍️</div>
              <h4>Tu carrito está vacío</h4>
              <p>Agregá alguno de nuestros postres artesanales para disfrutar del mejor vicio dulce.</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="cart-item">
                <img
                  src={item.imagen_url || '/assets/images/logo.svg'}
                  alt={item.nombre}
                  className="cart-item-img"
                  onError={(e) => { e.target.src = '/assets/images/logo.svg'; }}
                />
                <div className="cart-item-details">
                  <div className="cart-item-title">{item.nombre}</div>
                  <div className="cart-item-price">
                    ${Number(item.precio_final * item.cantidad).toLocaleString('es-AR')}
                  </div>
                  <div className="cart-item-qty-controls">
                    <button className="btn-qty" onClick={() => actualizarCantidad(item.id, -1)}>-</button>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.cantidad}</span>
                    <button className="btn-qty" onClick={() => actualizarCantidad(item.id, 1)}>+</button>
                  </div>
                </div>
                <button
                  className="btn-remove-item"
                  onClick={() => eliminarItem(item.id)}
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-subtotal-row">
              <span>Total:</span>
              <span id="cart-subtotal-amount">${Number(total).toLocaleString('es-AR')}</span>
            </div>
            <div className="cart-cuotas-info">
              💳 {cuotasInfo.texto}
            </div>
            <button
              className="btn-checkout"
              onClick={() => {
                onClose();
                navigate('/checkout');
              }}
            >
              Iniciar Checkout 🍰
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
