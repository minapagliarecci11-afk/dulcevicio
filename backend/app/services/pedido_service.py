import uuid
import secrets
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.pedidos import Pedido, ItemPedido, SolicitudRevocacion, Usuario
from app.models.producto import Producto
from app.schemas.pedido import PedidoCreate


def crear_pedido(db: Session, usuario: Usuario, datos: PedidoCreate) -> Pedido:
    """
    Crea un nuevo pedido de manera transaccional:
    - Consulta los productos desde la BD para garantizar precios reales.
    - Valida que haya suficiente stock disponible (lanza 409 si falla).
    - Descuenta las unidades del inventario.
    - Ejecuta commit o rollback ante cualquier falla para mantener la consistencia.
    """
    if not datos.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El pedido debe contener al menos un producto."
        )

    try:
        total_acumulado = Decimal("0.00")
        items_db = []

        for item_in in datos.items:
            # Consultar producto en BD
            producto = db.query(Producto).filter(Producto.id == item_in.producto_id).first()
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"El producto con ID {item_in.producto_id} no fue encontrado."
                )

            # Validar stock disponible
            if producto.stock < item_in.cantidad:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Stock insuficiente para el producto '{producto.nombre}'. Stock disponible: {producto.stock}, solicitado: {item_in.cantidad}."
                )

            # Descontar stock
            producto.stock -= item_in.cantidad

            # Calcular subtotales con precio real de la BD
            precio_unitario = Decimal(str(producto.precio_final)).quantize(Decimal("0.01"))
            subtotal = precio_unitario * Decimal(item_in.cantidad)
            total_acumulado += subtotal

            # Crear item de pedido
            item_db = ItemPedido(
                producto_id=producto.id,
                cantidad=item_in.cantidad,
                precio_unitario=precio_unitario
            )
            items_db.append(item_db)

        # Crear pedido en la base de datos
        nuevo_pedido = Pedido(
            usuario_id=usuario.id,
            total=total_acumulado,
            estado="pendiente",
            fecha_creacion=datetime.now(timezone.utc),
            items=items_db
        )

        db.add(nuevo_pedido)
        db.commit()
        db.refresh(nuevo_pedido)
        return nuevo_pedido

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al crear el pedido: {str(e)}"
        )


def revocar(db: Session, usuario: Usuario, pedido_id: int) -> SolicitudRevocacion:
    """
    Procesa la revocación de un pedido conforme a la Ley 24.240 y Disposición 954/2025:
    - Valida que el pedido pertenezca al usuario (404).
    - Valida que no esté cancelado previamente (409).
    - Valida el plazo legal de 10 días corridos desde la compra (409).
    - En una sola transacción: devuelve el stock a los productos, cambia estado a 'cancelado'
      y registra la SolicitudRevocacion con código único ARR-YYYYMMDD-HEX.
    """
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()

    # Validar existencia y pertenencia
    if not pedido or pedido.usuario_id != usuario.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El pedido con ID {pedido_id} no fue encontrado o no pertenece a su usuario."
        )

    # Validar que no esté cancelado previamente
    if pedido.estado.lower() in ["cancelado", "revocado"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El pedido ya ha sido cancelado o revocado con anterioridad."
        )

    # Validar plazo legal de 10 días corridos
    ahora = datetime.now(timezone.utc)
    fecha_pedido = pedido.fecha_creacion
    if fecha_pedido.tzinfo is None:
        fecha_pedido = fecha_pedido.replace(tzinfo=timezone.utc)

    dias_transcurridos = (ahora - fecha_pedido).days
    if dias_transcurridos > 10:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ha expirado el plazo legal de 10 días corridos para ejercer el derecho de revocación (transcurrieron {dias_transcurridos} días)."
        )

    try:
        # 1. Devolver el stock a cada producto
        for item in pedido.items:
            producto = db.query(Producto).filter(Producto.id == item.producto_id).first()
            if producto:
                producto.stock += item.cantidad

        # 2. Marcar pedido como cancelado
        pedido.estado = "cancelado"

        # 3. Generar código único ARR-YYYYMMDD-HEX
        fecha_str = ahora.strftime("%Y%m%d")
        hex_token = secrets.token_hex(4).upper()
        codigo_unico = f"ARR-{fecha_str}-{hex_token}"

        solicitud = SolicitudRevocacion(
            codigo=codigo_unico,
            pedido_id=pedido.id,
            usuario_id=usuario.id,
            creada_en=ahora,
            motivo="Derecho de revocación - Botón de Arrepentimiento Ley 24.240"
        )

        db.add(solicitud)
        db.commit()
        db.refresh(solicitud)
        return solicitud

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al procesar la revocación del pedido: {str(e)}"
        )
