import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (enviando) return;

    try {
      setEnviando(true);
      setError(null);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '60px auto', padding: '36px 28px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🍰</div>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--choco-dark)' }}>Ingresar a Dulce Vicio</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
          Accede a tus pedidos y gestión de cuenta personal.
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Correo Electrónico</label>
          <input
            id="login-email"
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
          <label className="form-label" htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            className="form-control"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={enviando}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={enviando}
          style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '12px' }}
        >
          {enviando ? 'Verificando credenciales...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
        ¿No tienes cuenta? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Regístrate aquí</Link>
      </div>
    </div>
  );
}
