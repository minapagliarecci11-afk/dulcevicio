import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RutaProtegida({ children, soloAdmin = false }) {
  const { user, esAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2.5rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>🍰</div>
        <p style={{ marginTop: '14px', fontWeight: 600 }}>Verificando credenciales de acceso...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (soloAdmin && !esAdmin) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '30px', textAlign: 'center', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
        <h2>Acceso Restringido</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '20px' }}>
          Se requieren permisos de Administrador para ver este panel.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
}
