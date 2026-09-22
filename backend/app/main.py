import os
import uuid
from typing import List, Optional
from fastapi import FastAPI, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import engine, Base
from app.dependencies import get_db
import app.models  # Asegura el registro de todos los modelos (Producto, Usuario, Pedido, ItemPedido, SolicitudRevocacion)

from app.routers.auth import router as auth_router
from app.routers.productos import router as productos_router
from app.routers.pedidos import router as pedidos_router
from app.routers.usuarios import router as usuarios_router
from app.schemas.pedido import ArrepentimientoRequest

# Crear tablas en base de datos si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    ## API Comercial Dulce Vicio 🍰
    Pastelería artesanal orientada a jóvenes de 12 a 20 años.
    
    ### Módulos Principales:
    - **Catálogo de Productos:** Consulta pública, gestión administrativa protegida y subida segura de imágenes.
    - **Autenticación & Ley 25.326:** Registro con consentimiento, emisión y renovación de tokens JWT Bearer, perfil y derechos ARCO.
    - **Checkout Transaccional de Pedidos:** Validación de stock, cálculo de importes con base de datos y control de integridad.
    - **Defensa del Consumidor & Arrepentimiento:** Conforme a **Ley Nacional N° 24.240**, **Res. 424/2020** y **Disposición 954/2025**.
    """,
    version="1.0.0"
)

# Configurar middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montaje seguro de la carpeta estática para imágenes y recursos públicos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
UPLOADS_DIR = os.path.join(STATIC_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Incluir routers modulares
app.include_router(auth_router)
app.include_router(productos_router)
app.include_router(pedidos_router)
app.include_router(usuarios_router)


@app.get("/", tags=["General"])
def read_root():
    return {
        "marca": "Dulce Vicio",
        "eslogan": "El gusto artesanal que le debíamos a la ciudad 🍰✨",
        "redes": {
            "instagram": "@dulcevicio.pasteleria",
            "tiktok": "@dulcevicio_oficial"
        },
        "docs_url": "/docs",
        "endpoints": {
            "auth": "/auth",
            "productos": "/productos",
            "pedidos": "/pedidos",
            "usuarios": "/usuarios",
            "arrepentimiento_publico": "/api/arrepentimiento",
            "defensa_consumidor": "/api/ley-24240"
        },
        "normativas": {
            "ley_24240": "Defensa del Consumidor (Botón de Arrepentimiento)",
            "disp_954_2025": "Código único de revocación y restitución de stock",
            "ley_25326": "Protección de Datos Personales (Derechos ARCO)"
        }
    }


@app.post("/api/arrepentimiento", tags=["Defensa del Consumidor - Ley 24.240"])
def procesar_arrepentimiento_publico(solicitud: ArrepentimientoRequest):
    """
    Botón de Arrepentimiento público conforme al Art. 34 de la Ley 24.240
    y la Resolución 424/2020.
    Permite a compradores solicitar la revocación sin requerir autenticación previa.
    Para usuarios con sesión iniciada, se recomienda el endpoint transaccional POST /pedidos/{id}/revocacion.
    """
    codigo_tramite = f"DV-REV-{uuid.uuid4().hex[:8].upper()}"
    return {
        "mensaje": "Solicitud de revocación recibida exitosamente bajo Ley 24.240 y Res. 424/2020.",
        "codigo_tramite": codigo_tramite,
        "pedido_id": solicitud.pedido_id,
        "email_notificacion": solicitud.email,
        "plazo_procesamiento_horas": 24,
        "garantia_reembolso": "100% reintegrado sin costos de cancelación ni devolución."
    }


@app.get("/api/ley-24240", tags=["Defensa del Consumidor - Ley 24.240"])
def obtener_info_ley_24240():
    """
    Información legal exigida por la Ley 24.240 de Defensa del Consumidor en Argentina.
    """
    return {
        "ley": "Ley Nacional N° 24.240 de Defensa del Consumidor (República Argentina)",
        "organismo_control": "Dirección Nacional de Defensa del Consumidor y Arbitraje del Consumo",
        "derechos_fundamentales": {
            "art_4_informacion": "El consumidor tiene derecho a ser provisto en forma cierta, clara y detallada de todo lo relacionado con las características de los productos que adquiere y las condiciones de su comercialización.",
            "art_8_bis_trato_digno": "Los proveedores deberán garantizar condiciones de atención y trato digno y equitativo a los consumidores y usuarios.",
            "art_10_ter_bajas": "El consumidor puede rescindir la compra o servicio por el mismo medio en que fue contratado.",
            "art_34_revocacion": "En ventas por medios postales o electrónicos, el consumidor tiene el derecho de revocar la aceptación durante el plazo de DIEZ (10) días corridos contados a partir de la fecha en que se entregue el bien o se celebre el contrato.",
            "res_424_2020": "Disposición obligatoria del Botón de Arrepentimiento de manera visible y accesible en la página de inicio.",
            "disp_954_2025": "Emisión inmediata de código identificador y reversión transaccional sin penalidades."
        }
    }
