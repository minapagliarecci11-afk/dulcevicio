import React, { createContext, useContext, useState, useEffect } from 'react';

const CarritoContext = createContext(null);
const STORAGE_KEY = 'dulce_vicio_cart_react_v1';

export function CarritoProvider({ children }) {
  // Inicialización de estado leyendo localStorage con bloque try/catch estricto
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error al leer el carrito desde localStorage:', e);
      return [];
    }
  });

  // Guardado reactivo en localStorage con bloque try/catch
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error al persistir el carrito en localStorage:', e);
    }
  }, [items]);

  const agregarItem = (producto, cantidad = 1) => {
    setItems(prevItems => {
      const index = prevItems.findIndex(i => i.id === producto.id);
      if (index >= 0) {
        const nuevos = [...prevItems];
        nuevos[index] = {
          ...nuevos[index],
          cantidad: nuevos[index].cantidad + cantidad
        };
        return nuevos;
      }
      return [
        ...prevItems,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio_final: producto.precio_final,
          imagen_url: producto.imagen_url,
          stock: producto.stock,
          cantidad
        }
      ];
    });
  };

  const actualizarCantidad = (productoId, delta) => {
    setItems(prevItems => {
      return prevItems
        .map(item => {
          if (item.id === productoId) {
            const nuevaCantidad = item.cantidad + delta;
            return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const eliminarItem = (productoId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productoId));
  };

  const vaciarCarrito = () => {
    setItems([]);
  };

  // Cálculos derivados
  const cantidadTotal = items.reduce((sum, item) => sum + item.cantidad, 0);
  const total = items.reduce((sum, item) => sum + (item.precio_final * item.cantidad), 0);

  const getInstallmentsInfo = (cuotas = 3) => {
    const valorCuota = total > 0 ? (total / cuotas).toFixed(2) : '0.00';
    return {
      cuotas,
      montoPorCuota: Number(valorCuota).toLocaleString('es-AR'),
      texto: `Hasta ${cuotas} cuotas fijas sin interés de $${Number(valorCuota).toLocaleString('es-AR')}`
    };
  };

  return (
    <CarritoContext.Provider value={{
      items,
      cantidadTotal,
      total,
      agregarItem,
      actualizarCantidad,
      eliminarItem,
      vaciarCarrito,
      getInstallmentsInfo
    }}>
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe ser utilizado dentro de un CarritoProvider');
  }
  return context;
}
