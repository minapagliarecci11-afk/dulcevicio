import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, clearTokens } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión al montar la aplicación
  useEffect(() => {
    async function loadUser() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await api.auth.getMe();
        setUser(userData);
      } catch (err) {
        console.warn('Token no válido o expirado, intentando refresco...');
        try {
          await api.auth.refresh();
          const refreshedUser = await api.auth.getMe();
          setUser(refreshedUser);
        } catch {
          clearTokens();
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    const userData = await api.auth.getMe();
    setUser(userData);
    return userData;
  };

  const register = async ({ nombre, email, password, telefono, acepto_tratamiento }) => {
    const nuevoUsuario = await api.auth.register({
      nombre,
      email,
      password,
      telefono,
      acepto_tratamiento
    });
    // Iniciar sesión automáticamente tras registro exitoso
    await login(email, password);
    return nuevoUsuario;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await api.auth.getMe();
      setUser(userData);
      return userData;
    } catch {
      logout();
    }
  };

  const esAdmin = user?.rol?.toLowerCase() === 'admin';

  return (
    <AuthContext.Provider value={{ user, esAdmin, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
