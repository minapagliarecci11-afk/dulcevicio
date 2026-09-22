from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.pedidos import Usuario, Pedido
from app.schemas.pedido import PedidoCreate, PedidoOut, SolicitudRevocacionOut
from app.services import pedido_service

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


@router.post("", response_model=PedidoOut, status_code=status.HTTP_201_CREATED, summary="Crear un nuevo pedido")
@router.post("/", response_model=PedidoOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def crear_pedido_endpoint(
    datos: PedidoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Crea un nuevo pedido de compra de manera transaccional.
    Calcula precios y total directamente desde la base de datos y descuenta stock.
    """
    nuevo_pedido = pedido_service.crear_pedido(db=db, usuario=current_user, datos=datos)
    return nuevo_pedido


# IMPORTANTE: Declarado estrictamente ANTES de /pedidos/{pedido_id} para evitar colisiones en FastAPI
@router.get("/mios", response_model=List[PedidoOut], summary="Listar pedidos del usuario autenticado")
def listar_mis_pedidos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Devuelve el historial completo de pedidos realizados por el usuario actual.
    """
    pedidos = (
        db.query(Pedido)
        .filter(Pedido.usuario_id == current_user.id)
        .order_by(Pedido.fecha_creacion.desc())
        .all()
    )
    return pedidos


@router.get("/{pedido_id}", response_model=PedidoOut, summary="Obtener detalle de un pedido por ID")
def detalle_pedido(
    pedido_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtiene el detalle de un pedido específico.
    Valida que el pedido pertenezca al usuario autenticado (o que sea administrador).
    """
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El pedido con ID {pedido_id} no fue encontrado."
        )

    # Validar pertenencia del usuario
    if pedido.usuario_id != current_user.id and current_user.rol.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El pedido con ID {pedido_id} no pertenece a su cuenta."
        )

    return pedido


@router.post("/{pedido_id}/revocacion", response_model=SolicitudRevocacionOut, status_code=status.HTTP_201_CREATED, summary="Revocar pedido (Botón de Arrepentimiento - Disposición 954/2025)")
def revocar_pedido_endpoint(
    pedido_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Ejecuta el derecho legal de revocación de compra (Disposición 954/2025 y Ley 24.240):
    - Verifica titularidad del pedido.
    - Valida plazo de 10 días corridos.
    - Devuelve el stock al catálogo.
    - Marca el pedido como cancelado.
    - Emite un código único e inmutable de trámite (ARR-YYYYMMDD-HEX).
    """
    solicitud = pedido_service.revocar(db=db, usuario=current_user, pedido_id=pedido_id)
    return SolicitudRevocacionOut(
        codigo=solicitud.codigo,
        pedido_id=solicitud.pedido_id,
        creada_en=solicitud.creada_en,
        mensaje="Solicitud de revocación procesada exitosamente bajo Ley 24.240 y Disposición 954/2025."
    )
