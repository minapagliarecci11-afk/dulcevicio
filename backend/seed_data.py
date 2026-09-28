"""
Script de precarga de datos iniciales para Dulce Vicio:
- Catálogo de productos artesanales (Ley 24.240)
- Usuarios de prueba: Administrador y Cliente (Ley 25.326)
Ejecutar con: python seed_data.py
"""
import sys
import os
from datetime import datetime, timezone

# Asegurar acceso a los módulos de app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from app.db.database import SessionLocal, engine, Base
from app.models.producto import Producto
from app.models.pedidos import Usuario
from app.core.security import hash_password

# Asegurar creación de tablas
Base.metadata.create_all(bind=engine)

PRODUCTOS_INICIALES = [
    {
        "nombre": "Tiramisú",
        "precio_final": 4500.0,
        "cuotas_cantidad": 3,
        "cuotas_valor": 1500.0,
        "garantia_meses": 1,
        "stock": 20,
        "descripcion": "Clásico postre italiano reversionado: capas de vainillas artesanales embebidas en café espresso especial, crema sedosa de mascarpone y lluvia de cacao amargo 100%.",
        "imagen_url": "assets/images/tiramisu.jpg",
        "categoria": "Postres Fríos"
    },
    {
        "nombre": "Brownie",
        "precio_final": 3000.0,
        "cuotas_cantidad": 3,
        "cuotas_valor": 1000.0,
        "garantia_meses": 1,
        "stock": 35,
        "descripcion": "El brownie más fudgy y chocolatoso de la ciudad. Crocante por fuera, húmedo por dentro, con trozos de nueces tostadas y chocolate semiamargo derretido.",
        "imagen_url": "assets/images/brownie.jpg",
        "categoria": "Chocolatería"
    },
    {
        "nombre": "Chocotorta",
        "precio_final": 4000.0,
        "cuotas_cantidad": 3,
        "cuotas_valor": 1333.33,
        "garantia_meses": 1,
        "stock": 25,
        "descripcion": "La reina de los cumpleaños argentinos: galletitas de chocolate humedecidas en leche chocolatada, intercaladas con la combinación perfecta de dulce de leche repostero y queso crema.",
        "imagen_url": "assets/images/chocotorta.jpg",
        "categoria": "Favoritos Argentinos"
    },
    {
        "nombre": "Turrón de Quaker",
        "precio_final": 4500.0,
        "cuotas_cantidad": 3,
        "cuotas_valor": 1500.0,
        "garantia_meses": 1,
        "stock": 18,
        "descripcion": "Pura nostalgia y sabor casero. Avena tostada crocante, manteca de primera calidad, cacao intenso y dulce de leche entre capas de galletitas crocantes.",
        "imagen_url": "assets/images/turron_quaker.jpg",
        "categoria": "Favoritos Argentinos"
    },
    {
        "nombre": "Budín de Pan",
        "precio_final": 2500.0,
        "cuotas_cantidad": 3,
        "cuotas_valor": 833.33,
        "garantia_meses": 1,
        "stock": 15,
        "descripcion": "Elaborado con receta de la abuela, pan brioche de masa madre, toque de ralladura de naranja y vainilla bourbon, bañado en caramelo rubio brillante.",
        "imagen_url": "assets/images/budin_de_pan.jpg",
        "categoria": "Postres Tradicionales"
    },
    {
        "nombre": "Flan",
        "precio_final": 3000.0,
        "cuotas_cantidad": 3,
        "cuotas_valor": 1000.0,
        "garantia_meses": 1,
        "stock": 22,
        "descripcion": "Flan casero extra cremoso de huevos de campo, cocido a baño maría lento. Acompañado de caramelo dorado y opción de dulce de leche repostero.",
        "imagen_url": "assets/images/flan.jpg",
        "categoria": "Postres Tradicionales"
    },
    {
        "nombre": "Cookie",
        "precio_final": 2500.0,
        "cuotas_cantidad": 3,
        "cuotas_valor": 833.33,
        "garantia_meses": 1,
        "stock": 50,
        "descripcion": "Cookie estilo New York gigante (180g), centro suave y derretido repleto de chips de chocolate con leche y escamas de sal marina.",
        "imagen_url": "assets/images/cookie.jpg",
        "categoria": "Cookies & Bocados"
    }
]

USUARIOS_INICIALES = [
    {
        "nombre": "Administrador General",
        "email": "admin@dulcevicio.com",
        "telefono": "+54 11 4000-0001",
        "hashed_password": hash_password("admin123"),
        "rol": "admin",
        "acepto_tratamiento": True,
        "fecha_consentimiento": datetime.now(timezone.utc),
        "activo": True
    },
    {
        "nombre": "Cliente Demostración",
        "email": "cliente@dulcevicio.com",
        "telefono": "+54 11 4000-0002",
        "hashed_password": hash_password("cliente123"),
        "rol": "cliente",
        "acepto_tratamiento": True,
        "fecha_consentimiento": datetime.now(timezone.utc),
        "activo": True
    }
]


def seed():
    db = SessionLocal()
    try:
        print("🍰 Precargando productos de Dulce Vicio...")
        for p in PRODUCTOS_INICIALES:
            existente = db.query(Producto).filter(Producto.nombre == p["nombre"]).first()
            if not existente:
                producto = Producto(**p)
                db.add(producto)
                print(f"  + Agregado producto: {p['nombre']} - ${p['precio_final']}")
            else:
                print(f"  ~ Producto existente: {p['nombre']}")

        print("👤 Precargando usuarios iniciales...")
        for u in USUARIOS_INICIALES:
            user_existente = db.query(Usuario).filter(Usuario.email == u["email"]).first()
            if not user_existente:
                usuario = Usuario(**u)
                db.add(usuario)
                print(f"  + Agregado usuario: {u['email']} (Rol: {u['rol']})")
            else:
                print(f"  ~ Usuario existente: {u['email']}")

        db.commit()
        print("✨ Carga inicial completada con éxito.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error al cargar datos: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
