from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.producto import Producto
from app.schemas.producto import ProductoCreate


def crear_producto(db: Session, producto: ProductoCreate) -> Producto:
    """
    Crea un nuevo producto en la base de datos a partir del schema ProductoCreate.
    Implementa control transaccional con try/except y db.rollback() ante fallos.
    """
    datos_producto = producto.model_dump() if hasattr(producto, "model_dump") else producto.dict()
    
    # Calcular cuotas si cuotas_valor no viene especificado pero hay cuotas_cantidad
    if datos_producto.get("cuotas_cantidad", 1) > 1 and datos_producto.get("cuotas_valor", 0) <= 0:
        datos_producto["cuotas_valor"] = round(datos_producto["precio_final"] / datos_producto["cuotas_cantidad"], 2)

    db_producto = Producto(**datos_producto)
    try:
        db.add(db_producto)
        db.commit()
        db.refresh(db_producto)
        return db_producto
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en base de datos al guardar el producto: {str(e)}"
        )


def listar_productos(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    nombre: Optional[str] = None,
    precio_max: Optional[float] = None
) -> List[Producto]:
    """
    Lista productos con paginación (skip, limit) y filtros opcionales por nombre y precio_max.
    """
    query = db.query(Producto)

    if nombre:
        query = query.filter(Producto.nombre.ilike(f"%{nombre}%"))

    if precio_max is not None:
        query = query.filter(Producto.precio_final <= precio_max)

    return query.order_by(Producto.id.asc()).offset(skip).limit(limit).all()


def obtener_producto_por_id(db: Session, producto_id: int) -> Optional[Producto]:
    """
    Obtiene un producto específico por su identificador primario.
    """
    return db.query(Producto).filter(Producto.id == producto_id).first()
