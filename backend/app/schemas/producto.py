from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ProductoBase(BaseModel):
    nombre: str = Field(..., description="Nombre del producto o postre artesanal")
    precio_final: float = Field(..., gt=0, description="Precio final de venta en ARS")
    cuotas_cantidad: int = Field(default=1, ge=1, description="Cantidad de cuotas disponibles")
    cuotas_valor: float = Field(default=0.0, ge=0, description="Monto aproximado por cuota")
    garantia_meses: int = Field(default=1, ge=0, description="Plazo de garantía legal y frescura en meses")
    stock: int = Field(default=0, ge=0, description="Unidades disponibles en stock")
    descripcion: Optional[str] = Field(default=None, description="Descripción del postre, ingredientes y notas")
    imagen_url: Optional[str] = Field(default=None, description="URL de la imagen del producto")
    categoria: Optional[str] = Field(default="Pastelería", description="Categoría del postre")


class ProductoCreate(ProductoBase):
    """Schema para creación de un producto."""
    pass


class ProductoUpdate(BaseModel):
    """Schema para actualización opcional de campos de producto."""
    nombre: Optional[str] = None
    precio_final: Optional[float] = None
    cuotas_cantidad: Optional[int] = None
    cuotas_valor: Optional[float] = None
    garantia_meses: Optional[int] = None
    stock: Optional[int] = None
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    categoria: Optional[str] = None


class ProductoOut(ProductoBase):
    """Schema para respuesta serializada de producto."""
    id: int

    model_config = ConfigDict(from_attributes=True)
