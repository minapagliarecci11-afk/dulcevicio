import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function Arrepentimiento() {
  const { user } = useAuth();
  const [pedidosUsuario, setPedidosUsuario] = useState([]);
  const [pedidoId, setPedidoId] = useState('');
  const [email, setEmail] = useState('');
  const [motivo, setMotivo] = useState('Derecho de revocación legal (10 días)');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [resultadoRevocacion, setResultadoRevocacion] = useState(null);

  // Si el usuario está autenticado, cargar sus pedidos para facilitar la selección
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      api.pedidos.listarMisPedidos()
        .then(data => setPedidosUsuario(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Requisito 2: Guard en la función de submit
    if (enviando) return;

    if (!pedidoId) {
      setError('Por favor indica el número de pedido a revocar.');
      return;
    }

    try {
      setEnviando(true);
      setError(null);

      let dataRespuesta;

      // Si el usuario está autenticado y seleccionó un pedido propio, invocar endpoint transaccional POST /pedidos/{id}/revocacion
      if (user) {
        dataRespuesta = await api.pedidos.revocar(pedidoId);
      } else {
        // Si es usuario público anónimo, invocar endpoint público bajo Res. 424/2020
        dataRespuesta = await api.pedidos.arrepentimientoPublico({
          pedido_id: pedidoId,
          email,
          motivo
        });
      }

      setResultadoRevocacion(dataRespuesta);
    } catch (err) {
      // Manejo de error 404 (pedido no pertenece) o 409 (plazo legal vencido o ya cancelado)
      setError(err.message || 'Error al procesar la revocación del pedido.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto', padding: '36px 24px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>↩️</div>
        <h1 style={{ fontSize: '2rem', color: 'var(--choco-dark)' }}>
          Botón de Arrepentimiento
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
          Conforme al <strong>Art. 34 de la Ley 24.240</strong>, la <strong>Res. 424/2020</strong> y la <strong>Disposición 954/2025</strong>.
        </p>
      </div>

      {resultadoRevocacion ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: '4rem', marginBottom: '12px' }}>✅</div>
          <h2 style={{ fontSize: '1.6rem', color: '#059669', marginBottom: '8px' }}>
            Revocación Procesada con Éxito
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Se ha cancelado la orden, restituido el stock al inventario y generado tu código formal de trámite:
          </p>

          {/* Requisito 3: Visualización explícita y prominente del código de identificación devuelto por la API */}
          <div style={{ background: '#fdf2f8', border: '2px dashed var(--primary)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--choco-dark)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Código Único de Identificación de Revocación:
            </div>
            <div style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary)', marginTop: '8px' }}>
              {resultadoRevocacion.codigo || resultadoRevocacion.codigo_tramite}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Pedido ID #{resultadoRevocacion.pedido_id || pedidoId} • Garantía 100% Reembolso
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '28px' }}>
            Conforme a la normativa vigente, no se aplicará ningún costo de cancelación ni penalidad. Conserva este código para el seguimiento de tu trámite.
          </p>

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => { setResultadoRevocacion(null); setPedidoId(''); }}
          >
            Iniciar Otra Consulta
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '14px', borderRadius: '10px', fontSize: '0.88rem', marginBottom: '20px' }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ background: '#faf6f3', padding: '16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem', color: 'var(--choco-rich)', lineHeight: '1.6' }}>
            📌 <strong>Plazo Legal de 10 días:</strong> Dispones de 10 días corridos a partir de la compra o recepción del bien para revocar la aceptación sin cargo alguno.
          </div>

          {user && pedidosUsuario.length > 0 && (
            <div className="form-group">
              <label className="form-label">Seleccionar de mis pedidos recientes:</label>
              <select
                className="form-control"
                value={pedidoId}
                onChange={(e) => setPedidoId(e.target.value)}
                disabled={enviando}
              >
                <option value="">-- Elige un pedido --</option>
                {pedidosUsuario.map(p => (
                  <option key={p.id} value={p.id}>
                    Pedido #{p.id} • ${Number(p.total).toLocaleString('es-AR')} • Estado: {p.estado}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="pedido-id-input">Número de Pedido Oficial *</label>
            <input
              id="pedido-id-input"
              type="number"
              className="form-control"
              required
              placeholder="Ej: 104"
              value={pedidoId}
              onChange={(e) => setPedidoId(e.target.value)}
              disabled={enviando}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Correo Electrónico de Notificación *</label>
            <input
              id="email-input"
              type="email"
              className="form-control"
              required
              placeholder="tu-email@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={enviando}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="motivo-select">Motivo de Revocación (Opcional)</label>
            <select
              id="motivo-select"
              className="form-control"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={enviando}
            >
              <option value="Derecho de revocación legal (10 días)">Derecho de revocación legal (10 días corridos)</option>
              <option value="Error al seleccionar los postres">Error al seleccionar los postres</option>
              <option value="Cambio de planes o fecha">Cambio de planes o fecha</option>
              <option value="Otro motivo">Otro motivo</option>
            </select>
          </div>

          {/* Requisito 2: Deshabilitado del botón en UI (disabled={enviando}) */}
          <button
            type="submit"
            className="btn-arrepentimiento-main"
            disabled={enviando}
            style={{ width: '100%', marginTop: '16px', padding: '14px' }}
          >
            {enviando ? 'Verificando plazo legal y procesando...' : 'Confirmar Arrepentimiento de Compra'}
          </button>
        </form>
      )}
    </div>
  );
}
