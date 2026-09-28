import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [aceptoTratamiento, setAceptoTratamiento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (enviando) return;

    if (!aceptoTratamiento) {
      setError('Debes aceptar expresamente el tratamiento de datos personales conforme a la Ley 25.326 para registrarte.');
      return;
    }

    try {
      setEnviando(true);
      setError(null);
      await register({
        nombre,
        email,
        password,
        telefono,
        acepto_tratamiento: aceptoTratamiento
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al procesar el registro.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '36px 28px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🍰✨</div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--choco-dark)' }}>Crear Cuenta en Dulce Vicio</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
          Regístrate para realizar pedidos y acceder a promociones exclusivas.
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="reg-nombre">Nombre y Apellido *</label>
          <input
            id="reg-nombre"
            type="text"
            className="form-control"
            required
            placeholder="Sofía Martínez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={enviando}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="reg-email">Correo Electrónico *</label>
          <input
            id="reg-email"
            type="email"
            className="form-control"
            required
            placeholder="sofia@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={enviando}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="reg-password">Contraseña (Mínimo 6 caracteres) *</label>
          <input
            id="reg-password"
            type="password"
            className="form-control"
            required
            minLength={6}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={enviando}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="reg-telefono">Teléfono / WhatsApp (Opcional)</label>
          <input
            id="reg-telefono"
            type="tel"
            className="form-control"
            placeholder="+54 9 11 2345-6789"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            disabled={enviando}
          />
        </div>

        {/* Consentimiento expreso e informado conforme a la Ley 25.326 */}
        <div style={{ background: '#faf6f3', border: '1px solid #f3eae2', padding: '14px', borderRadius: '10px', margin: '20px 0', fontSize: '0.82rem', lineHeight: '1.5' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={aceptoTratamiento}
              onChange={(e) => setAceptoTratamiento(e.target.checked)}
              disabled={enviando}
              style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: 'var(--primary)' }}
              required
            />
            <span>
              <strong>Consentimiento Ley 25.326:</strong> Acepto expresamente el tratamiento de mis datos personales para la gestión de pedidos, facturación y ejercicio de derechos ARCO.
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={enviando || !aceptoTratamiento}
          style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
        >
          {enviando ? 'Registrando usuario...' : 'Crear Mi Cuenta ✨'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
        ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Inicia sesión</Link>
      </div>
    </div>
  );
}
