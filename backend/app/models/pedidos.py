from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    telefono = Column(String(50), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    rol = Column(String(50), default="cliente", nullable=False)  # cliente, admin
    
    # Cumplimiento Ley 25.326 (Protección de Datos Personales)
    acepto_tratamiento = Column(Boolean, default=False, nullable=False)
    fecha_consentimiento = Column(DateTime, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    fecha_baja = Column(DateTime, nullable=True)

    # Relaciones
    pedidos = relationship("Pedido", back_populates="usuario", cascade="all, delete-orphan")
    solicitudes_revocacion = relationship("SolicitudRevocacion", back_populates="usuario", cascade="all, delete-orphan")


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    total = Column(Numeric(12, 2), nullable=False, default=0.0)
    estado = Column(String(50), default="pendiente", nullable=False)  # pendiente, pagado, entregado, cancelado
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relaciones
    usuario = relationship("Usuario", back_populates="pedidos")
    items = relationship("ItemPedido", back_populates="pedido", cascade="all, delete-orphan")
    solicitudes_revocacion = relationship("SolicitudRevocacion", back_populates="pedido", cascade="all, delete-orphan")


class ItemPedido(Base):
    __tablename__ = "items_pedido"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    precio_unitario = Column(Numeric(12, 2), nullable=False)

    # Relaciones
    pedido = relationship("Pedido", back_populates="items")
    producto = relationship("Producto")


class SolicitudRevocacion(Base):
    """
    Modelo de revocación de compra conforme a la Ley 24.240 y Disposición 954/2025.
    Registra el código único de trámite, usuario, pedido y timestamp UTC.
    """
    __tablename__ = "solicitudes_revocacion"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    codigo = Column(String(100), unique=True, index=True, nullable=False)  # ej. ARR-YYYYMMDD-HEX
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    creada_en = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    motivo = Column(String(255), nullable=True, default="Derecho de revocación - Botón de Arrepentimiento")

    # Relaciones
    pedido = relationship("Pedido", back_populates="solicitudes_revocacion")
    usuario = relationship("Usuario", back_populates="solicitudes_revocacion")
