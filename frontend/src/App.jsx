import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { RutaProtegida } from './components/RutaProtegida';

import { Catalogo } from './pages/Catalogo';
import { Checkout } from './pages/Checkout';
import { Arrepentimiento } from './pages/Arrepentimiento';
import { MisDatos } from './pages/MisDatos';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminProductos } from './pages/AdminProductos';

export function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <AuthProvider>
      <CarritoProvider>
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar onOpenCart={() => setCartOpen(true)} />

          <div style={{ flex: 1 }}>
            <Routes>
              {/* Ruta pública principal */}
              <Route path="/" element={<Catalogo onOpenCart={() => setCartOpen(true)} />} />

              {/* Requisito: Página de Arrepentimiento PÚBLICA (fuera de RutaProtegida) */}
              <Route path="/arrepentimiento" element={<Arrepentimiento />} />

              {/* Checkout */}
              <Route path="/checkout" element={<Checkout />} />

              {/* Autenticación */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Rutas Privadas y Normativas (Ley 25.326) */}
              <Route
                path="/mis-datos"
                element={
                  <RutaProtegida>
                    <MisDatos />
                  </RutaProtegida>
                }
              />

              {/* Ruta de Administrador */}
              <Route
                path="/admin"
                element={
                  <RutaProtegida soloAdmin={true}>
                    <AdminProductos />
                  </RutaProtegida>
                }
              />

              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          <Footer />

          <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        </div>
      </CarritoProvider>
    </AuthProvider>
  );
}

export default App;
