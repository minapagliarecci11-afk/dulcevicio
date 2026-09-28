/**
 * DULCE VICIO - Pastelería Artesanal
 * Cliente Centralizado de API (FastAPI)
 * 
 * Cumplimiento de Auditoría:
 * 1. BASE_URL dinámico desde import.meta.env.VITE_API_URL (sin barra final).
 * 2. Peticiones con FormData (subida de imágenes) SIN cabecera Content-Type manual (boundary automático).
 * 3. Inyección automática del header 'Authorization: Bearer <token>'.
 * 4. Manejo y traducción centralizada de códigos de estado HTTP (400, 401, 403, 404, 409, 413, 415, 500).
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const BASE_URL = RAW_API_URL.replace(/\/+$/, '');

// Clave de almacenamiento de token JWT
const TOKEN_KEY = 'dulce_vicio_access_token';
const REFRESH_TOKEN_KEY = 'dulce_vicio_refresh_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setTokens = (accessToken, refreshToken) => {
  try {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (e) {
    console.error('Error guardando tokens en localStorage:', e);
  }
};

export const clearTokens = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (e) {
    console.error('Error limpiando tokens:', e);
  }
};

/**
 * Traduce códigos de estado HTTP a mensajes entendibles por el usuario
 */
function traducirErrorHTTP(status, detalle = '') {
  switch (status) {
    case 400:
      return detalle || 'Solicitud inválida o consentimiento legal requerido no otorgado (Ley 25.326).';
    case 401:
      return 'No autorizado. Tu sesión ha expirado o las credenciales son incorrectas.';
    case 403:
      return 'Acceso denegado. Se requieren permisos de administrador o la cuenta está inactiva.';
    case 404:
      return detalle || 'El recurso solicitado no fue encontrado.';
    case 409:
      return detalle || 'Conflicto: stock insuficiente o trámite ya procesado con anterioridad.';
    case 413:
      return 'El archivo supera el tamaño máximo permitido de 2 MB.';
    case 415:
      return 'Formato de archivo no soportado. Permitidos: .jpg, .jpeg, .png, .webp.';
    case 500:
      return 'Error interno en el servidor. Por favor, intenta nuevamente más tarde.';
    default:
      return detalle || `Ocurrió un error inesperado (Código ${status}).`;
  }
}

/**
 * Función fetcher centralizada con inyección de Bearer y manejo de errores
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = { ...options.headers };
  const token = getToken();

  // Inyectar Authorization: Bearer <token> si existe
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Si body es FormData, NO forzar Content-Type (el navegador debe insertar multipart/form-data con boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  } else if (!headers['Content-Type'] && options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let detalleError = '';
      try {
        const errorJson = await response.json();
        detalleError = errorJson.detail || errorJson.message || '';
      } catch {
        detalleError = await response.text();
      }

      const mensajeTraducido = traducirErrorHTTP(response.status, detalleError);
      const error = new Error(mensajeTraducido);
      error.status = response.status;
      error.detail = detalleError;
      throw error;
    }

    // Si la respuesta es vacía o es 204 No Content
    if (response.status === 204) {
      return null;
    }

    // Verificar si es descarga de archivo (Content-Disposition o Blob)
    const disposition = response.headers.get('content-disposition');
    if (disposition && disposition.includes('attachment')) {
      const blob = await response.blob();
      return { blob, disposition };
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`No se pudo conectar con el servidor en ${BASE_URL}. Verifica que el backend esté en ejecución.`);
    }
    throw error;
  }
}

export const api = {
  // 1. Módulo de Autenticación & Ley 25.326
  auth: {
    async register({ nombre, email, password, telefono, acepto_tratamiento }) {
      return await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          nombre,
          email,
          password,
          telefono: telefono || null,
          acepto_tratamiento: Boolean(acepto_tratamiento)
        })
      });
    },

    async login({ email, password }) {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data && data.access_token) {
        setTokens(data.access_token, data.refresh_token);
      }
      return data;
    },

    async refresh() {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) throw new Error('No hay refresh token disponible');
      const data = await request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      if (data && data.access_token) {
        setTokens(data.access_token, data.refresh_token);
      }
      return data;
    },

    async getMe() {
      return await request('/auth/me');
    }
  },

  // 2. Módulo de Catálogo de Productos y Carga de Imágenes
  productos: {
    async listar({ nombre = '', precio_max = null, skip = 0, limit = 100 } = {}) {
      const params = new URLSearchParams();
      if (nombre) params.append('nombre', nombre);
      if (precio_max !== null && precio_max !== undefined && precio_max !== '') {
        params.append('precio_max', precio_max);
      }
      params.append('skip', skip);
      params.append('limit', limit);
      return await request(`/productos?${params.toString()}`);
    },

    async detalle(productoId) {
      return await request(`/productos/${productoId}`);
    },

    async crear(productoData) {
      return await request('/productos', {
        method: 'POST',
        body: JSON.stringify(productoData)
      });
    },

    async actualizar(productoId, productoData) {
      return await request(`/productos/${productoId}`, {
        method: 'PUT',
        body: JSON.stringify(productoData)
      });
    },

    /**
     * Subida segura de imágenes en FormData:
     * El navegador adjunta automáticamente el boundary sin Content-Type manual.
     */
    async subirImagen(productoId, file) {
      const formData = new FormData();
      formData.append('archivo', file);
      return await request(`/productos/${productoId}/imagen`, {
        method: 'POST',
        body: formData
      });
    }
  },

  // 3. Módulo de Pedidos y Checkout Transaccional (Clase 8)
  pedidos: {
    /**
     * Crea un pedido con validación de stock y precios de base de datos
     * items: [{ producto_id: number, cantidad: number }]
     */
    async crear(items) {
      return await request('/pedidos/', {
        method: 'POST',
        body: JSON.stringify({ items })
      });
    },

    async listarMisPedidos() {
      return await request('/pedidos/mios');
    },

    async detalle(pedidoId) {
      return await request(`/pedidos/${pedidoId}`);
    },

    /**
     * Revocación bajo Ley 24.240 y Disposición 954/2025 (Clase 9)
     */
    async revocar(pedidoId) {
      return await request(`/pedidos/${pedidoId}/revocacion`, {
        method: 'POST'
      });
    },

    /**
     * Botón de Arrepentimiento público sin autenticación (Res. 424/2020)
     */
    async arrepentimientoPublico({ pedido_id, email, motivo }) {
      return await request('/api/arrepentimiento', {
        method: 'POST',
        body: JSON.stringify({
          pedido_id: parseInt(pedido_id),
          email,
          motivo
        })
      });
    }
  },

  // 4. Módulo de Usuarios & Derechos ARCO (Ley 25.326)
  usuarios: {
    async misDatos() {
      return await request('/usuarios/me/datos');
    },

    /**
     * Descarga de datos personales con Content-Disposition en formato Blob
     */
    async exportarDatos() {
      const result = await request('/usuarios/me/exportar');
      return result; // { blob, disposition }
    },

    /**
     * Supresión y anonimización de datos (Art. 16 Ley 25.326)
     */
    async darDeBaja() {
      return await request('/usuarios/me', {
        method: 'DELETE'
      });
    }
  }
};
