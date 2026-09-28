import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function MisDatos() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [datosPersonales, setDatosPersonales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para exportación
  const [exportando, setExportando] = useState(false);
  const [mensajeExportacion, setMensajeExportacion] = useState(null);

  // Estados para baja / supresión
  const [modalBajaAbierto, setModalBajaAbierto] = useState(false);
  const [confirmacionTexto, setConfirmacionTexto] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const [errorBaja, setErrorBaja] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.usuarios.misDatos();
      setDatosPersonales(res);
    } catch (err) {
      setError(err.message || 'Error al obtener datos personales.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Requisito: Exportación limpia mediante Fetch / Blob y descarga directa
   */
  const handleExportarDatos = async () => {
    if (exportando) return;
    try {
      setExportando(true);
      setMensajeExportacion(null);

      const resultado = await api.usuarios.exportarDatos();
      if (!resultado || !resultado.blob) {
        throw new Error('No se recibió el archivo de exportación.');
      }

      // Extraer nombre del archivo del Content-Disposition o valor por defecto
      let filename = `mis_datos_dulcevicio_${user?.id || 'usuario'}.json`;
      if (resultado.disposition) {
        const match = resultado.disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      // Crear URL de objeto para descarga limpia en el navegador
      const downloadUrl = URL.createObjectURL(resultado.blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setMensajeExportacion('¡Archivo descargado con éxito!');
    } catch (err) {
      setError(err.message || 'Error al exportar los datos.');
    } finally {
      setExportando(false);
    }
  };

  /**
   * Requisito: Flujo de 'Eliminar mi cuenta' que exige confirmación por escrito (input de texto)
   */
  const handleConfirmarBaja = async (e) => {
    e.preventDefault();
    if (eliminando) return;

    if (confirmacionTexto.trim() !== 'ELIMINAR') {
      setErrorBaja('Debes escribir exactamente la palabra ELIMINAR en mayúsculas.');
      return;
    }

    try {
      setEliminando(true);
      setErrorBaja(null);
      await api.usuarios.darDeBaja();
      logout();
      alert('Tu cuenta ha sido dada de baja y tus datos han sido anonimizados conforme a la Ley 25.326.');
      navigate('/');
    } catch (err) {
      setErrorBaja(err.message || 'Error al procesar la baja de la cuenta.');
    } finally {
      setEliminando(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2.5rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>🍰</div>
        <p style={{ marginTop: '12px', fontWeight: 600 }}>Cargando datos personales...</p>
      </div>
    );
  }

  const titular = datosPersonales?.titular || user;
  const pedidos = datosPersonales?.historial_pedidos || [];

  return (
    <div style={{ maxWidth: '720px', margin: '40px auto', padding: '36px 24px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '18px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--choco-dark)' }}>
          Mis Datos Personales (Ley 25.326)
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px' }}>
          Gestión de Derechos ARCO: Acceso, Rectificación, Cancelación y Portabilidad.
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px', borderRadius: '10px', fontSize: '0.88rem', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {mensajeExportacion && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px', borderRadius: '10px', fontSize: '0.88rem', marginBottom: '20px' }}>
          ✅ {mensajeExportacion}
        </div>
      )}

      {/* Datos del Titular */}
      <div style={{ background: '#faf6f3', padding: '20px', borderRadius: '12px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', color: 'var(--choco-dark)' }}>
          Datos Registrados en la Plataforma:
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '0.9rem' }}>
          <div>Nombre y Apellido: <strong>{titular?.nombre}</strong></div>
          <div>Correo Electrónico: <strong>{titular?.email}</strong></div>
          <div>Teléfono: <strong>{titular?.telefono || 'No registrado'}</strong></div>
          <div>Rol de Cuenta: <strong>{titular?.rol}</strong></div>
          <div>Consentimiento Ley 25.326: <strong style={{ color: '#059669' }}>{titular?.acepto_tratamiento ? 'Aceptado e Informado' : 'No'}</strong></div>
          <div>Estado de Cuenta: <strong style={{ color: titular?.activo ? '#059669' : '#dc2626' }}>{titular?.activo ? 'Activa' : 'Dada de baja'}</strong></div>
        </div>
      </div>

      {/* Historial de Pedidos */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--choco-dark)' }}>
          Historial de Pedidos Asociados ({pedidos.length}):
        </h3>
        {pedidos.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aún no has realizado pedidos con esta cuenta.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pedidos.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.88rem' }}>
                <span>Pedido #{p.id} • {p.cantidad_items} postres</span>
                <span><strong>${Number(p.total).toLocaleString('es-AR')}</strong> • <span style={{ textTransform: 'uppercase', color: '#059669' }}>{p.estado}</span></span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acciones de Portabilidad y Supresión (Derechos ARCO) */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button
            className="btn-primary"
            onClick={handleExportarDatos}
            disabled={exportando}
            style={{ fontSize: '0.9rem' }}
          >
            {exportando ? 'Generando archivo...' : '📥 Exportar Mis Datos (JSON)'}
          </button>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Descarga limpia con formato Blob estructurado.
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setModalBajaAbierto(true)}
            style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
          >
            🗑️ Eliminar mi Cuenta
          </button>
        </div>
      </div>

      {/* Modal con confirmación obligatoria por escrito */}
      {modalBajaAbierto && (
        <div className="modal-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content-card" style={{ maxWidth: '500px', width: '90%', padding: '28px' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#991b1b', marginBottom: '8px' }}>
              ⚠️ Confirmar Supresión de Cuenta (Ley 25.326)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '16px' }}>
              Esta acción anonimizará tu nombre, correo electrónico, teléfono y credenciales, inhabilitando el acceso a la cuenta. Los pedidos históricos se mantendrán anonimizados por obligaciones fiscales.
            </p>

            <form onSubmit={handleConfirmarBaja}>
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                <label className="form-label" style={{ color: '#881337', fontWeight: 700 }}>
                  Escribe la palabra <strong>ELIMINAR</strong> para confirmar:
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ELIMINAR"
                  value={confirmacionTexto}
                  onChange={(e) => setConfirmacionTexto(e.target.value)}
                  disabled={eliminando}
                  required
                />
              </div>

              {errorBaja && (
                <div style={{ color: '#991b1b', fontSize: '0.85rem', marginBottom: '12px' }}>
                  {errorBaja}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setModalBajaAbierto(false); setConfirmacionTexto(''); }}
                  disabled={eliminando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={eliminando || confirmacionTexto.trim() !== 'ELIMINAR'}
                  style={{
                    background: confirmacionTexto.trim() === 'ELIMINAR' ? '#dc2626' : '#fca5a5',
                    color: 'white',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: confirmacionTexto.trim() === 'ELIMINAR' ? 'pointer' : 'not-allowed'
                  }}
                >
                  {eliminando ? 'Anonimizando...' : 'Confirmar Supresión Definitiva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
