from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.producto import ProductoOut


class UsuarioBase(BaseModel):
    nombre: str
    email: str
    telefono: Optional[str] = None


class UsuarioCreate(UsuarioBase):
    pass


class UsuarioOut(UsuarioBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Clase 8: Item de entrada en PedidoCreate validando cantidad > 0
class ItemIn(BaseModel):
    producto_id: int = Field(..., description="ID del producto a adquirir")
    cantidad: int = Field(..., gt=0, description="Cantidad de unidades requeridas (debe ser mayor a 0)")


# Clase 8: PedidoCreate que excluye precio, total y usuario_id del cuerpo de entrada
class PedidoCreate(BaseModel):
    items: List[ItemIn] = Field(..., min_length=1, description="Listado de productos a ordenar")


class ItemPedidoBase(BaseModel):
    producto_id: int
    cantidad: int = Field(default=1, ge=1)
    precio_unitario: Decimal = Field(gt=0)


class ItemPedidoCreate(ItemPedidoBase):
    pass


class ItemPedidoOut(BaseModel):
    id: int
    producto_id: int
    cantidad: int
    precio_unitario: Decimal
    producto: Optional[ProductoOut] = None

    model_config = ConfigDict(from_attributes=True)


class PedidoOut(BaseModel):
    id: int
    usuario_id: int
    total: Decimal
    estado: str
    fecha_creacion: datetime
    items: List[ItemPedidoOut] = []

    model_config = ConfigDict(from_attributes=True)


# Clase 9: Salida de revocación bajo Disposición 954/2025
class SolicitudRevocacionOut(BaseModel):
    codigo: str = Field(..., description="Código único de identificación de revocación (ARR-YYYYMMDD-HEX)")
    pedido_id: int
    creada_en: datetime
    mensaje: str = "Solicitud de revocación procesada exitosamente bajo Ley 24.240 y Disposición 954/2025."

    model_config = ConfigDict(from_attributes=True)


class ArrepentimientoRequest(BaseModel):
    """Solicitud de revocación bajo Ley 24.240 y Resolución 424/2020."""
    pedido_id: int
    email: str
    motivo: Optional[str] = "Derecho de revocación - Botón de Arrepentimiento"
