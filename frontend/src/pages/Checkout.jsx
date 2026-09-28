import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function Checkout() {
  const { items, total, getInstallmentsInfo, vaciarCarrito } = useCarrito();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [enviando, setEnviando] = useState(false);
  const [errorBackend, setErrorBackend] = useState(null);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

  const cuotasInfo = getInstallmentsInfo(3);

  // Si el carrito está vacío y no hay orden recién confirmada
  if (items.length === 0 && !pedidoConfirmado) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '40px 20px', textAlign: 'center', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '14px' }}>🛍️</div>
        <h2>Tu carrito está vacío</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '24px' }}>
          Agregá deliciosos postres artesanales desde nuestra carta para iniciar la compra.
        </p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
          🍰 Ver Carta de Postres
        </Link>
      </div>
    );
  }

  // Vista de confirmación exitosa con número de pedido y recordatorio Ley 24.240
  if (pedidoConfirmado) {
    return (
      <div style={{ maxWidth: '640px', margin: '60px auto', padding: '40px 24px', textAlign: 'center', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '12px' }}>🎉🍰</div>
        <h2 style={{ fontSize: '2rem', color: 'var(--choco-dark)', marginBottom: '8px' }}>
          ¡Tu pedido está confirmado!
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Muchas gracias por tu compra. Estamos preparando tus postres frescos con elaboración artesanal.
        </p>

        <div style={{ background: '#faf6f3', padding: '24px', borderRadius: '12px', textAlign: 'left', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e0db', paddingBottom: '12px', marginBottom: '12px' }}>
            <span style={{ fontWeight: 700 }}>Número de Pedido Oficial:</span>
            <span style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>
              #{pedidoConfirmado.id}
            </span>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--choco-rich)', lineHeight: '1.8' }}>
            <div>Total abonado: <strong>${Number(pedidoConfirmado.total).toLocaleString('es-AR')}</strong></div>
            <div>Estado de la orden: <span style={{ textTransform: 'uppercase', fontWeight: 700, color: '#059669' }}>{pedidoConfirmado.estado}</span></div>
            <div>Titular: <strong>{user?.nombre}</strong> ({user?.email})</div>
            <div>Fecha: <strong>{new Date(pedidoConfirmado.fecha_creacion).toLocaleString('es-AR')}</strong></div>
          </div>
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '16px', borderRadius: '10px', fontSize: '0.85rem', color: '#92400e', textAlign: 'left', marginBottom: '28px' }}>
          📌 <strong>Garantía y Derecho de Arrepentimiento (Ley 24.240 & Disp. 954/2025):</strong>
          <br />
          Conservá el número de pedido <strong>#{pedidoConfirmado.id}</strong>. Conforme al Art. 34, contás con 10 días corridos para revocar tu compra online desde nuestro <strong>Botón de Arrepentimiento</strong> con reintegro del 100% y devolución de stock inmediata.
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/" className="btn-secondary">Volver al Inicio</Link>
          <Link to="/arrepentimiento" className="btn-primary" style={{ background: 'var(--caramel)' }}>
            ↩️ Ir a Botón de Arrepentimiento
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmitCheckout = async (e) => {
    e.preventDefault();

    // Requisito 2: Guard en la función de submit para impedir solicitudes duplicadas concurrentes
    if (enviando) return;

    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    try {
      setEnviando(true);
      setErrorBackend(null);

      // Mapear items a estructura esperada por FastAPI PedidoCreate: { items: [{ producto_id, cantidad }] }
      const itemsPayload = items.map(item => ({
        producto_id: item.id,
        cantidad: item.cantidad
      }));

      // Invocación al endpoint transaccional POST /pedidos/
      const ordenCreada = await api.pedidos.crear(itemsPayload);

      // Vaciar carrito tras éxito y mostrar confirmación
      vaciarCarrito();
      setPedidoConfirmado(ordenCreada);
    } catch (err) {
      // Manejo específico de HTTP 409 (Conflicto por falta de stock) o 401
      setErrorBackend(err.message || 'Error inesperado al procesar la compra.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '40px auto', padding: '32px 24px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontSize: '1.8rem', color: 'var(--choco-dark)', marginBottom: '8px' }}>
        Finalizar Pedido Artesanal 🍰
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
        Completá tu compra con cálculo verificado de precios y stock transaccional en tiempo real.
      </p>

      {errorBackend && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '16px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '20px' }}>
          <strong>⚠️ No se pudo completar el pedido:</strong>
          <p style={{ marginTop: '4px' }}>{errorBackend}</p>
        </div>
      )}

      {/* Resumen del Pedido */}
      <div style={{ background: '#faf6f3', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
        <h4 style={{ fontSize: '1rem', marginBottom: '14px', color: 'var(--choco-dark)' }}>Productos a ordenar:</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>{item.nombre} <strong style={{ color: 'var(--primary)' }}>x{item.cantidad}</strong></span>
              <span style={{ fontWeight: 700 }}>${Number(item.precio_final * item.cantidad).toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #e5e0db', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Total Estimado:</span>
          <span style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>
            ${Number(total).toLocaleString('es-AR')}
          </span>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700, marginTop: '6px' }}>
          💳 {cuotasInfo.texto}
        </div>
      </div>

      {!user ? (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ color: '#1e40af', fontWeight: 600, marginBottom: '14px' }}>
            Debes iniciar sesión o registrarte para completar tu pedido transaccional.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/login" state={{ from: '/checkout' }} className="btn-secondary">Iniciar Sesión</Link>
            <Link to="/register" state={{ from: '/checkout' }} className="btn-primary">Crear Cuenta</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitCheckout}>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem' }}>
            <div>Comprador autenticado: <strong>{user.nombre}</strong></div>
            <div>Email registrado: <strong>{user.email}</strong></div>
            <div>Teléfono: <strong>{user.telefono || 'No especificado'}</strong></div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
            🔒 Al presionar Confirmar, se valida el stock disponible en la base de datos y se registra tu pedido con garantía conforme a la <strong>Ley 24.240</strong>. Dispones de 10 días para revocar la compra online de forma 100% gratuita.
          </div>

          {/* Requisito 2: Botón deshabilitado durante el envío (disabled={enviando}) */}
          <button
            type="submit"
            className="btn-primary"
            disabled={enviando || items.length === 0}
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.05rem' }}
          >
            {enviando ? 'Validando stock y procesando pedido...' : `Confirmar Pedido Transaccional ($${Number(total).toLocaleString('es-AR')}) ✨`}
          </button>
        </form>
      )}
    </div>
  );
}
