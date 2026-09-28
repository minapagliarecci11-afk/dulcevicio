import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SubirImagenModal } from '../components/SubirImagenModal';

export function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productoParaFoto, setProductoParaFoto] = useState(null);

  // Formulario nuevo producto
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    precio_final: '',
    cuotas_cantidad: 3,
    stock: 20,
    descripcion: '',
    categoria: 'Pastelería'
  });
  const [creando, setCreando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.productos.listar();
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar productos.');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    if (creando) return;

    try {
      setCreando(true);
      setError(null);
      setMensajeExito(null);

      const prodCreado = await api.productos.crear({
        nombre: nuevoProducto.nombre,
        precio_final: parseFloat(nuevoProducto.precio_final),
        cuotas_cantidad: parseInt(nuevoProducto.cuotas_cantidad),
        stock: parseInt(nuevoProducto.stock),
        descripcion: nuevoProducto.descripcion,
        categoria: nuevoProducto.categoria
      });

      setMensajeExito(`¡Producto '${prodCreado.nombre}' creado exitosamente con ID #${prodCreado.id}!`);
      setNuevoProducto({
        nombre: '',
        precio_final: '',
        cuotas_cantidad: 3,
        stock: 20,
        descripcion: '',
        categoria: 'Pastelería'
      });
      cargarProductos();
    } catch (err) {
      setError(err.message || 'Error al crear producto.');
    } finally {
      setCreando(false);
    }
  };

  const handleUploadSuccess = (productoActualizado) => {
    setMensajeExito(`¡Imagen subida exitosamente para '${productoActualizado.nombre}'!`);
    cargarProductos();
  };

  return (
    <div style={{ maxWidth: '960px', margin: '40px auto', padding: '36px 24px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--choco-dark)' }}>
          Panel de Administración de Productos (Admin) ⚙️
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Gestión del catálogo artesanal y módulo seguro de carga de imágenes (Magic bytes & 2 MB).
        </p>
      </div>

      {mensajeExito && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '20px' }}>
          ✅ {mensajeExito}
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Formulario para agregar producto */}
      <div style={{ background: '#faf6f3', padding: '24px', borderRadius: '12px', marginBottom: '36px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--choco-dark)' }}>
          + Agregar Nuevo Postre al Catálogo
        </h3>
        <form onSubmit={handleCrearProducto} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label className="form-label">Nombre del Postre *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="Ej: Cheesecake de Frutos Rojos"
              value={nuevoProducto.nombre}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
              disabled={creando}
            />
          </div>

          <div>
            <label className="form-label">Precio Final en ARS ($) *</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              required
              placeholder="5500"
              value={nuevoProducto.precio_final}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio_final: e.target.value })}
              disabled={creando}
            />
          </div>

          <div>
            <label className="form-label">Stock Inicial *</label>
            <input
              type="number"
              className="form-control"
              required
              value={nuevoProducto.stock}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, stock: e.target.value })}
              disabled={creando}
            />
          </div>

          <div>
            <label className="form-label">Categoría</label>
            <select
              className="form-control"
              value={nuevoProducto.categoria}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })}
              disabled={creando}
            >
              <option value="Pastelería">Pastelería</option>
              <option value="Chocolatería">Chocolatería</option>
              <option value="Postres Fríos">Postres Fríos</option>
              <option value="Favoritos Argentinos">Favoritos Argentinos</option>
              <option value="Cookies & Bocados">Cookies & Bocados</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Descripción</label>
            <input
              type="text"
              className="form-control"
              placeholder="Detalle de ingredientes y notas de sabor..."
              value={nuevoProducto.descripcion}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, descripcion: e.target.value })}
              disabled={creando}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="submit" className="btn-primary" disabled={creando}>
              {creando ? 'Guardando en BD...' : 'Guardar Producto ✨'}
            </button>
          </div>
        </form>
      </div>

      {/* Listado de Productos */}
      <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--choco-dark)' }}>
        Catálogo Activo ({productos.length} productos)
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando productos...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>ID</th>
                <th style={{ padding: '12px' }}>Postre</th>
                <th style={{ padding: '12px' }}>Precio</th>
                <th style={{ padding: '12px' }}>Stock</th>
                <th style={{ padding: '12px' }}>Imagen URL</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>#{p.id}</td>
                  <td style={{ padding: '12px' }}>
                    <strong>{p.nombre}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.categoria}</div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 700 }}>${Number(p.precio_final).toLocaleString('es-AR')}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: p.stock > 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                      {p.stock} un.
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.imagen_url || 'Sin imagen'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => setProductoParaFoto(p)}
                    >
                      📸 Subir Foto
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Seguro de Subida de Imagen */}
      {productoParaFoto && (
        <SubirImagenModal
          producto={productoParaFoto}
          isOpen={Boolean(productoParaFoto)}
          onClose={() => setProductoParaFoto(null)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
