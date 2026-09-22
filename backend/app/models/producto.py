from sqlalchemy import Column, Integer, String, Float, Text
from app.db.database import Base


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(150), nullable=False, index=True)
    precio_final = Column(Float, nullable=False)
    cuotas_cantidad = Column(Integer, default=1, nullable=False)
    cuotas_valor = Column(Float, default=0.0, nullable=False)
    garantia_meses = Column(Integer, default=1, nullable=False)
    stock = Column(Integer, default=0, nullable=False)

    # Campos complementarios para enriquecer el catálogo visual
    descripcion = Column(Text, nullable=True)
    imagen_url = Column(String(255), nullable=True)
    categoria = Column(String(50), default="Pastelería", nullable=True)
