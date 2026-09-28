import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3>Dulce<span style={{ color: 'var(--primary)' }}>Vicio</span></h3>
          <p>
            Pastelería artesanal nacida del deseo de compartir sabores auténticos y darle un gusto a nuestra ciudad.
          </p>
          <div style={{ marginTop: '16px', fontWeight: 700, color: 'white' }}>
            🍰 Hecho a mano cada mañana
          </div>
        </div>

        <div className="footer-col">
          <h4>Navegación</h4>
          <ul className="footer-links">
            <li><Link to="/">Inicio / Catálogo</Link></li>
            <li><Link to="/arrepentimiento" style={{ color: '#ff85a1', fontWeight: 700 }}>↩️ Botón de Arrepentimiento</Link></li>
            <li><Link to="/mis-datos">Tus Datos Personales (Ley 25.326)</Link></li>
            <li><Link to="/login">Acceso Clientes / Administrador</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Redes Sociales</h4>
          <ul className="footer-links">
            <li><a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">TikTok: @dulcevicio_oficial</a></li>
            <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram: @dulcevicio.pasteleria</a></li>
            <li><a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer">WhatsApp: +54 9 11 2345-6789</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Defensa del Consumidor</h4>
          <ul className="footer-links">
            <li><Link to="/#ley-consumidor">Derechos bajo Ley 24.240</Link></li>
            {/* Requisito: Enlace visible y accesible desde el Footer en cualquier pantalla hacia /arrepentimiento */}
            <li>
              <Link to="/arrepentimiento" style={{ color: '#ff85a1', fontWeight: 800, textDecoration: 'underline' }}>
                Botón de Arrepentimiento (10 días)
              </Link>
            </li>
            <li>
              <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" target="_blank" rel="noopener noreferrer">
                Dirección Nacional de Defensa del Consumidor
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>
          © 2026 Dulce Vicio Pastelería Artesanal. Todos los derechos reservados.
        </div>
        <div>
          Cumplimiento estricto Ley 24.240, Disposición 954/2025 y Ley 25.326.
        </div>
      </div>
    </footer>
  );
}
