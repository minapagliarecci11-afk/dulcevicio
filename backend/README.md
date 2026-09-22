# Dulce Vicio - Backend API 🍰✨

Backend de comercio electrónico para la pastelería artesanal **Dulce Vicio**, desarrollado con **FastAPI**, **SQLAlchemy**, **PostgreSQL** y **Alembic**, con arquitectura modular limpia y cumplimiento pleno de la **Ley Nacional N° 24.240 de Defensa del Consumidor**, **Disposición 954/2025** y **Ley 25.326 de Protección de Datos Personales**.

---

## 1. Comandos de Terminal

### 1.1. Instalación de Dependencias Requeridas
Para instalar las librerías del backend (incluyendo los paquetes de autenticación y validación solicitados):

```bash
# Instalación desde requirements.txt:
pip install -r requirements.txt

# O instalación individual de los paquetes de seguridad:
pip install "passlib[bcrypt]>=1.7.4" "bcrypt==4.0.1" "python-jose[cryptography]>=3.3.0" "python-multipart>=0.0.9" "email-validator>=2.1.0"
```

---

### 1.2. Configuración de Variables de Entorno (`.env`)
Ajusta tus credenciales y parámetros de seguridad en `.env`:

```ini
PROJECT_NAME="Dulce Vicio - Pastelería Artesanal API"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_db"
CORS_ORIGINS="http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000,http://127.0.0.1:8000,http://localhost:5173"

# Configuración JWT y Seguridad (Clase 7)
SECRET_KEY="dulce-vicio-secret-key-super-segura-2026-cambiar-en-produccion"
ALGORITHM="HS256"
ACCESS_MIN=30
REFRESH_MIN=10080
```

---

### 1.3. Migraciones con Alembic
Para aplicar los esquemas relacionales a la base de datos:

```bash
# 1. Generar la revisión de migración automática:
alembic revision --autogenerate -m "autenticacion_pedidos_revocacion_ley25326"

# 2. Aplicar las migraciones a PostgreSQL:
alembic upgrade head
```

---

### 1.4. Precarga de Datos Iniciales (`seed_data.py`)
Carga el catálogo artesanal (con precios y cuotas) y los usuarios iniciales (`admin@dulcevicio.com` / `admin123` y `cliente@dulcevicio.com` / `cliente123`):

```bash
python seed_data.py
```

---

### 1.5. Ejecución del Servidor Backend y Suite de Pruebas
```bash
# Iniciar servidor con recarga automática:
python -m uvicorn app.main:app --reload --port 8000

# Ejecutar suite completa de pruebas automatizadas (25/25 tests):
python test_api.py
```

- Documentación interactiva Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Documentación alternativa ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 2. Mapa de Endpoints y Módulos Implementados

### Autenticación, Autorización y Ley 25.326 (Clase 7)
- `POST /auth/register`: Registro de usuario; rechaza si `acepto_tratamiento=False`. Hashea con bcrypt.
- `POST /auth/login`: Autenticación por credenciales; retorna `access_token` y `refresh_token`.
- `POST /auth/refresh`: Renovación de access token mediante refresh token no expirado.
- `GET /auth/me`: Perfil del usuario autenticado y activo (`activo=True`).

### Catálogo de Productos y Subida Segura de Archivos
- `GET /productos`: Listado público con filtros por nombre, precio máximo y paginación.
- `GET /productos/{id}`: Detalle de producto específico.
- `POST /productos`: Creación de producto protegida con `Depends(require_admin)`.
- `PUT /productos/{id}`: Actualización de producto protegida con `Depends(require_admin)`.
- `POST /productos/{id}/imagen`: Subida de imágenes protegida con `Depends(require_admin)`.
  - Validación de extensiones (`.jpg`, `.jpeg`, `.png`, `.webp`).
  - Límite estricto de 2 MB.
  - Validación de números mágicos binarios vía `parece_imagen()`.
  - Generación de nombre seguro único `{id}-{token_hex}.ext` en `/static/uploads/`.

### Checkout Transaccional de Pedidos (Clase 8)
- `POST /pedidos/`: Creación transaccional (`PedidoCreate` con `ItemIn(cantidad > 0)`, sin exponer precios ni total en el cuerpo).
  - Consulta y calcula precios reales desde la base de datos.
  - Valida stock disponible (retorna HTTP 409 si es insuficiente).
  - Descuenta stock en inventario y ejecuta `try/except/rollback`.
- `GET /pedidos/mios`: Historial de pedidos del usuario autenticado (declarado antes del endpoint por ID).
- `GET /pedidos/{id}`: Consulta de detalle validando titularidad del usuario.

### Revocación y Disposición 954/2025 (Clase 9)
- `POST /pedidos/{id}/revocacion`: Retorna HTTP 201 y código `ARR-YYYYMMDD-HEX`.
  - Valida pertenencia del pedido (HTTP 404).
  - Valida que no esté cancelado (HTTP 409).
  - Valida plazo legal de 10 días corridos (`datetime.now(timezone.utc)`).
  - En una sola transacción: reintegra stock de productos y marca pedido como `cancelado`.
- `POST /api/arrepentimiento`: Endpoint público accesible sin autenticación conforme a Ley 24.240.

### Derechos ARCO - Ley 25.326 (Protección de Datos Personales)
- `GET /usuarios/me/datos`: Consulta íntegra de datos personales del titular (Art. 14 - Derecho de Acceso).
- `GET /usuarios/me/exportar`: Descarga estructurada en JSON con cabecera `Content-Disposition: attachment; filename="datos_usuario_{id}.json"` (Portabilidad).
- `DELETE /usuarios/me`: Supresión/Cancelación (Art. 16 - Derecho al Olvido): anonimiza `nombre`, `email`, teléfono y clave, establece `activo=False` y registra `fecha_baja` sin romper la integridad referencial de pedidos históricos.
