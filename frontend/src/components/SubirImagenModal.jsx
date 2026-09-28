import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

const EXTENSIONES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB estricto

export function SubirImagenModal({ producto, isOpen, onClose, onUploadSuccess }) {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errorValidacion, setErrorValidacion] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Requisito a: useRef para manipular y limpiar el <input type="file"> sin usar la propiedad value
  const fileInputRef = useRef(null);

  // Requisito b: Previsualización con URL.createObjectURL y limpieza con URL.revokeObjectURL en cleanup
  useEffect(() => {
    if (!archivoSeleccionado) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(archivoSeleccionado);
    setPreviewUrl(objectUrl);

    // Función de limpieza para prevenir fugas de memoria (memory leaks)
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [archivoSeleccionado]);

  if (!isOpen || !producto) return null;

  const handleFileChange = (e) => {
    setErrorValidacion(null);
    const file = e.target.files?.[0];
    if (!file) {
      setArchivoSeleccionado(null);
      return;
    }

    // Requisito c: Validaciones en el cliente antes de procesar
    // 1. Extensión / Tipo
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
      setErrorValidacion(`Formato inválido. Extensiones permitidas: ${EXTENSIONES_PERMITIDAS.join(', ')}`);
      limpiarInput();
      return;
    }

    // 2. Tamaño máximo de 2 MB
    if (file.size > MAX_BYTES) {
      const megas = (file.size / (1024 * 1024)).toFixed(2);
      setErrorValidacion(`El archivo pesa ${megas} MB y excede el límite máximo de 2 MB.`);
      limpiarInput();
      return;
    }

    setArchivoSeleccionado(file);
  };

  const limpiarInput = () => {
    setArchivoSeleccionado(null);
    // Limpieza segura mediante useRef sin mutar prop 'value' directamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard contra envíos concurrentes
    if (enviando) return;
    if (!archivoSeleccionado) {
      setErrorValidacion('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    try {
      setEnviando(true);
      setErrorValidacion(null);
      const resultado = await api.productos.subirImagen(producto.id, archivoSeleccionado);
      limpiarInput();
      if (onUploadSuccess) onUploadSuccess(resultado);
      onClose();
    } catch (err) {
      setErrorValidacion(err.message || 'Error al subir la imagen al servidor.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content-card" style={{ maxWidth: '520px', width: '90%', padding: '28px' }}>
        <button className="modal-close-btn" onClick={onClose} disabled={enviando}>✕</button>

        <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--choco-dark)' }}>
          Subir Foto Artesanal 📸
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Producto: <strong>{producto.nombre}</strong> (ID #{producto.id})
        </p>

        {errorValidacion && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {errorValidacion}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              Seleccionar archivo (.jpg, .jpeg, .png, .webp — Máx 2 MB)
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={enviando}
              className="form-control"
              style={{ padding: '8px' }}
            />
          </div>

          {/* Previsualización en tiempo real */}
          {previewUrl && (
            <div style={{ margin: '16px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Vista Previa en Memoria:</div>
              <img
                src={previewUrl}
                alt="Vista previa del postre"
                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px', border: '2px solid var(--accent)' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { limpiarInput(); onClose(); }}
              disabled={enviando}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={enviando || !archivoSeleccionado}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {enviando ? 'Subiendo imagen...' : 'Confirmar y Guardar 🍰'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
