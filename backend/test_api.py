import os
import sys
import io

# Configurar base de datos SQLite en memoria/archivo temporal para tests
os.environ["DATABASE_URL"] = "sqlite:///./test_temp.db"
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import Base, engine, SessionLocal
from app.models.producto import Producto
from app.models.pedidos import Usuario, Pedido, ItemPedido, SolicitudRevocacion

# Recrear tablas limpias para la suite de pruebas
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

print("=" * 60)
print("INICIANDO SUITE DE PRUEBAS DE SEGURIDAD Y BACKEND")
print("=" * 60)

# 1. Test Endpoint raíz y Ley 24.240 pública
r_root = client.get("/")
assert r_root.status_code == 200, f"Error en root: {r_root.text}"
print(" 1. GET / -> OK:", r_root.json()["marca"])

r_ley = client.get("/api/ley-24240")
assert r_ley.status_code == 200
print(" 2. GET /api/ley-24240 -> OK")

# 2. Test Autenticación y Ley 25.326 (Consentimiento)
# 2.1 Registro rechazado si acepto_tratamiento = False
reg_rechazado = {
    "nombre": "Juan Perez",
    "email": "juan@example.com",
    "password": "password123",
    "acepto_tratamiento": False
}
r_reg_bad = client.post("/auth/register", json=reg_rechazado)
assert r_reg_bad.status_code == 400, f"Debería rechazar si acepto_tratamiento=False: {r_reg_bad.text}"
print(" 3. POST /auth/register con acepto_tratamiento=False -> Rechazado con 400 OK")

# 2.2 Registro exitoso con acepto_tratamiento = True
reg_exitoso = {
    "nombre": "Juan Perez",
    "email": "juan@example.com",
    "password": "password123",
    "telefono": "+54 11 5555-1234",
    "acepto_tratamiento": True
}
r_reg_ok = client.post("/auth/register", json=reg_exitoso)
assert r_reg_ok.status_code == 201, f"Fallo registro cliente: {r_reg_ok.text}"
user_data = r_reg_ok.json()
assert user_data["email"] == "juan@example.com"
assert user_data["acepto_tratamiento"] is True
assert user_data["activo"] is True
print(" 4. POST /auth/register con acepto_tratamiento=True -> 201 Creado OK")

# 2.3 Registro de Administrador (email admin@...)
reg_admin = {
    "nombre": "Admin Boss",
    "email": "admin@dulcevicio.com",
    "password": "adminpassword123",
    "acepto_tratamiento": True
}
r_admin = client.post("/auth/register", json=reg_admin)
assert r_admin.status_code == 201
assert r_admin.json()["rol"] == "admin"
print(" 5. POST /auth/register (Admin) -> 201 Rol Admin OK")

# 2.4 Login exitoso y obtención de JWT (access + refresh)
login_payload = {
    "email": "juan@example.com",
    "password": "password123"
}
r_login = client.post("/auth/login", json=login_payload)
assert r_login.status_code == 200, f"Fallo login: {r_login.text}"
tokens = r_login.json()
cliente_token = tokens["access_token"]
cliente_refresh = tokens["refresh_token"]
assert "access_token" in tokens and "refresh_token" in tokens
print(" 6. POST /auth/login -> 200 Tokens JWT generados OK")

# Login de Admin
r_login_admin = client.post("/auth/login", json={"email": "admin@dulcevicio.com", "password": "adminpassword123"})
assert r_login_admin.status_code == 200
admin_token = r_login_admin.json()["access_token"]

# 2.5 Refresh token
r_refresh = client.post("/auth/refresh", json={"refresh_token": cliente_refresh})
assert r_refresh.status_code == 200
nuevo_access = r_refresh.json()["access_token"]
assert nuevo_access is not None
print(" 7. POST /auth/refresh -> 200 Nuevo Access Token OK")

# 2.6 GET /auth/me
r_me = client.get("/auth/me", headers={"Authorization": f"Bearer {cliente_token}"})
assert r_me.status_code == 200
assert r_me.json()["email"] == "juan@example.com"
print(" 8. GET /auth/me -> 200 Perfil obtenido OK")

# 3. Test Catálogo y Control de Acceso (require_admin)
# 3.1 Intento de crear producto como cliente común -> 403
prod_payload = {
    "nombre": "Tiramisú Especial",
    "precio_final": 5000.0,
    "cuotas_cantidad": 3,
    "stock": 10,
    "descripcion": "Tiramisú artesanal con mascarpone"
}
r_prod_forbidden = client.post("/productos", json=prod_payload, headers={"Authorization": f"Bearer {cliente_token}"})
assert r_prod_forbidden.status_code == 403, f"Cliente no debería crear producto: {r_prod_forbidden.status_code}"
print(" 9. POST /productos sin rol admin -> Bloqueado con 403 Forbidden OK")

# 3.2 Crear producto con rol Admin -> 201
r_prod_admin = client.post("/productos", json=prod_payload, headers={"Authorization": f"Bearer {admin_token}"})
assert r_prod_admin.status_code == 201, f"Admin debería crear producto: {r_prod_admin.text}"
prod_creado = r_prod_admin.json()
producto_id = prod_creado["id"]
assert prod_creado["precio_final"] == 5000.0
assert prod_creado["stock"] == 10
print("10. POST /productos con rol Admin -> 201 Creado OK (ID:", producto_id, ")")

# 4. Test Subida Segura de Imágenes
# 4.1 Archivo con extensión prohibida (.exe disfrazado) -> 400
bad_ext = ("malware.exe", b"MZ\x90\x00\x03\x00\x00\x00", "application/octet-stream")
r_upload_bad_ext = client.post(
    f"/productos/{producto_id}/imagen",
    files={"archivo": bad_ext},
    headers={"Authorization": f"Bearer {admin_token}"}
)
assert r_upload_bad_ext.status_code == 400
print("11. POST /productos/{id}/imagen con extensión no permitida -> Rechazado con 400 OK")

# 4.2 Archivo .jpg con magic bytes falsos (trampa) -> 400
fake_jpg = ("trampa.jpg", b"ESTO NO ES UN JPG REAL SINO TEXTO", "image/jpeg")
r_upload_fake = client.post(
    f"/productos/{producto_id}/imagen",
    files={"archivo": fake_jpg},
    headers={"Authorization": f"Bearer {admin_token}"}
)
assert r_upload_fake.status_code == 400
print("12. POST /productos/{id}/imagen con magic bytes inválidos -> Rechazado con 400 OK")

# 4.3 Imagen PNG auténtica con magic bytes reales -> 200 y ruta segura
png_magic = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
real_png = ("foto_real.png", png_magic, "image/png")
r_upload_ok = client.post(
    f"/productos/{producto_id}/imagen",
    files={"archivo": real_png},
    headers={"Authorization": f"Bearer {admin_token}"}
)
assert r_upload_ok.status_code == 200, f"Fallo upload seguro: {r_upload_ok.text}"
img_url = r_upload_ok.json()["imagen_url"]
assert img_url.startswith("/static/uploads/")
print("13. POST /productos/{id}/imagen con magic bytes legítimos -> 200 Guardado en:", img_url)

# 5. Checkout Transaccional de Pedidos (Clase 8)
# 5.1 PedidoCreate con cantidad > stock disponible -> 409 Conflict
pedido_exceso = {
    "items": [
        {"producto_id": producto_id, "cantidad": 999}
    ]
}
r_ped_stock = client.post("/pedidos/", json=pedido_exceso, headers={"Authorization": f"Bearer {cliente_token}"})
assert r_ped_stock.status_code == 409, f"Debería retornar 409 por stock: {r_ped_stock.text}"
print("14. POST /pedidos/ con stock insuficiente -> Rechazado con 409 Conflict OK")

# 5.2 PedidoCreate exitoso (precio y total calculados desde DB)
pedido_valido = {
    "items": [
        {"producto_id": producto_id, "cantidad": 2}
    ]
}
r_ped_ok = client.post("/pedidos/", json=pedido_valido, headers={"Authorization": f"Bearer {cliente_token}"})
assert r_ped_ok.status_code == 201, f"Fallo crear pedido: {r_ped_ok.text}"
ped_data = r_ped_ok.json()
pedido_id = ped_data["id"]
# 2 unidades * $5000 = $10000
assert float(ped_data["total"]) == 10000.0
assert ped_data["estado"] == "pendiente"
print("15. POST /pedidos/ exitoso -> Total calculado por DB: $10000.0, Pedido ID:", pedido_id)

# Verificar descuento de stock en el producto (10 - 2 = 8)
r_prod_check = client.get(f"/productos/{producto_id}")
assert r_prod_check.json()["stock"] == 8
print("16. Verificación de stock descontado en DB -> Stock restante: 8 OK")

# 5.3 GET /pedidos/mios
r_mios = client.get("/pedidos/mios", headers={"Authorization": f"Bearer {cliente_token}"})
assert r_mios.status_code == 200
assert len(r_mios.json()) >= 1
print("17. GET /pedidos/mios -> 200 Listado de pedidos del usuario OK")

# 5.4 GET /pedidos/{id}
r_det_ped = client.get(f"/pedidos/{pedido_id}", headers={"Authorization": f"Bearer {cliente_token}"})
assert r_det_ped.status_code == 200
print("18. GET /pedidos/{id} con pertenencia -> 200 OK")

# 6. Revocación / Arrepentimiento Disposición 954/2025 (Clase 9)
# 6.1 Revocar pedido (devuelve stock 8 -> 10, estado='cancelado', código ARR-YYYYMMDD-HEX)
r_rev = client.post(f"/pedidos/{pedido_id}/revocacion", headers={"Authorization": f"Bearer {cliente_token}"})
assert r_rev.status_code == 201, f"Fallo revocación: {r_rev.text}"
rev_data = r_rev.json()
assert rev_data["codigo"].startswith("ARR-")
print("19. POST /pedidos/{id}/revocacion -> 201 Código emitido:", rev_data["codigo"])

# Verificar restitución de stock (8 + 2 = 10)
r_prod_restaurado = client.get(f"/productos/{producto_id}")
assert r_prod_restaurado.json()["stock"] == 10
print("20. Verificación de stock restituido tras revocación -> Stock: 10 OK")

# 6.2 Intento de revocar pedido ya cancelado -> 409 Conflict
r_rev_reintento = client.post(f"/pedidos/{pedido_id}/revocacion", headers={"Authorization": f"Bearer {cliente_token}"})
assert r_rev_reintento.status_code == 409
print("21. Reintento de revocación sobre pedido ya cancelado -> Rechazado con 409 Conflict OK")

# 7. Derechos ARCO - Ley 25.326
# 7.1 GET /usuarios/me/datos (Derecho de Acceso)
r_arco_datos = client.get("/usuarios/me/datos", headers={"Authorization": f"Bearer {cliente_token}"})
assert r_arco_datos.status_code == 200
assert r_arco_datos.json()["titular"]["email"] == "juan@example.com"
print("22. GET /usuarios/me/datos (Derecho de Acceso) -> 200 OK")

# 7.2 GET /usuarios/me/exportar (Portabilidad con Content-Disposition)
r_export = client.get("/usuarios/me/exportar", headers={"Authorization": f"Bearer {cliente_token}"})
assert r_export.status_code == 200
assert "attachment" in r_export.headers.get("content-disposition", "")
print("23. GET /usuarios/me/exportar -> 200 con Content-Disposition attachment OK")

# 7.3 DELETE /usuarios/me (Derecho de Supresión / Anonimización)
r_baja = client.delete("/usuarios/me", headers={"Authorization": f"Bearer {cliente_token}"})
assert r_baja.status_code == 200
baja_data = r_baja.json()
assert baja_data["activo"] is False
assert baja_data["fecha_baja"] is not None
print("24. DELETE /usuarios/me (Supresión/Anonimización) -> 200 Usuario anonimizado y dado de baja OK")

# 7.4 Intento de acceso posterior con token del usuario dado de baja -> 401 Unauthorized / 403 Forbidden
r_me_baja = client.get("/auth/me", headers={"Authorization": f"Bearer {cliente_token}"})
assert r_me_baja.status_code in [401, 403], f"Debe rechazar token de cuenta dada de baja: {r_me_baja.status_code}"
print("25. Intento de uso de cuenta dada de baja -> Bloqueado con", r_me_baja.status_code, "OK")

print("\n" + "=" * 60)
print("TODAS LAS PRUEBAS AUTOMATIZADAS PASARON EXITOSAMENTE (25/25)")
print("=" * 60)
