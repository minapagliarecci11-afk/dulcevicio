import os
import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_admin
from app.models.pedidos import Usuario
from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoUpdate, ProductoOut
from app.services import productos as productos_service

router = APIRouter(prefix="/productos", tags=["Productos"])

# Directorio de almacenamiento de imágenes
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Extensiones permitidas y límite de tamaño
EXTENSIONES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024  # Límite estricto de 2 MB


def parece_imagen(contenido: bytes) -> bool:
    """
    Valida mediante números mágicos (magic bytes) la firma binaria real del archivo
    para impedir archivos ejecutables o trampas disfrazadas con extensión de imagen.
    """
    if len(contenido) < 12:
        return False

    # JPEG / JPG: FF D8 FF
    if contenido.startswith(b"\xff\xd8\xff"):
        return True

    # PNG: 89 50 4E 47 0D 0A 1A 0A
    if contenido.startswith(b"\x89PNG\r\n\x1a\n"):
        return True

    # WEBP: RIFF .... WEBP
    if contenido.startswith(b"RIFF") and contenido[8:12] == b"WEBP":
        return True

    return False


@router.get("", response_model=List[ProductoOut], summary="Listar catálogo de productos (Público)")
@router.get("/", response_model=List[ProductoOut], include_in_schema=False)
def listar_productos_endpoint(
    skip: int = Query(0, ge=0, description="Cantidad de registros a omitir para paginación"),
    limit: int = Query(100, ge=1, le=200, description="Cantidad máxima de productos a retornar"),
    nombre: Optional[str] = Query(None, description="Filtro de búsqueda por nombre de postre"),
    precio_max: Optional[float] = Query(None, ge=0, description="Precio máximo en ARS"),
    db: Session = Depends(get_db)
):
    """
    Lista los productos disponibles con soporte de filtros por nombre,
    precio máximo y paginación. Acceso público sin autenticación.
    """
    return productos_service.listar_productos(
        db=db,
        skip=skip,
        limit=limit,
        nombre=nombre,
        precio_max=precio_max
    )


@router.post("", response_model=ProductoOut, status_code=status.HTTP_201_CREATED, summary="Crear producto (Requiere Administrador)")
@router.post("/", response_model=ProductoOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def crear_producto_endpoint(
    producto: ProductoCreate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    """
    Registra un nuevo producto en el catálogo.
    Requiere obligatoriamente rol de administrador (Depends(require_admin)).
    """
    nuevo_producto = productos_service.crear_producto(db=db, producto=producto)
    return nuevo_producto


@router.get("/{producto_id}", response_model=ProductoOut, summary="Detalle de un producto por ID (Público)")
def detalle_producto_endpoint(
    producto_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene los detalles completos de un producto específico.
    """
    producto = productos_service.obtener_producto_por_id(db=db, producto_id=producto_id)
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El producto con ID {producto_id} no fue encontrado."
        )
    return producto


@router.put("/{producto_id}", response_model=ProductoOut, summary="Actualizar producto (Requiere Administrador)")
def actualizar_producto_endpoint(
    producto_id: int,
    producto_in: ProductoUpdate,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    """
    Actualiza la información de un producto existente.
    Protegido con Depends(require_admin).
    """
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El producto con ID {producto_id} no fue encontrado."
        )

    datos = producto_in.model_dump(exclude_unset=True) if hasattr(producto_in, "model_dump") else producto_in.dict(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(producto, campo, valor)

    try:
        db.commit()
        db.refresh(producto)
        return producto
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar producto.")


@router.post("/{producto_id}/imagen", response_model=ProductoOut, summary="Subir imagen de producto segura (Requiere Administrador)")
async def subir_imagen_producto(
    producto_id: int,
    archivo: UploadFile = File(..., description="Archivo de imagen (.jpg, .jpeg, .png, .webp) máx 2 MB"),
    db: Session = Depends(get_db),
    admin: Usuario = Depends(require_admin)
):
    """
    Módulo seguro de subida de imagen de producto:
    a) Valida extensión permitida (.jpg, .jpeg, .png, .webp).
    b) Valida tamaño máximo de 2 MB.
    c) Valida firma real de bytes (magic numbers) vía parece_imagen().
    d) Genera un nombre seguro único {producto_id}-{token_hex}.ext (evita path traversal y sobreescritura).
    e) Persiste en /static/uploads/ y actualiza imagen_url.
    """
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El producto con ID {producto_id} no fue encontrado."
        )

    # 1. Validación de extensión de archivo
    nombre_original = archivo.filename or ""
    _, ext = os.path.splitext(nombre_original.lower())
    if ext not in EXTENSIONES_PERMITIDAS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extensión no permitida '{ext}'. Formatos válidos: {', '.join(sorted(EXTENSIONES_PERMITIDAS))}."
        )

    # 2. Leer contenido y validar tamaño (máx 2 MB)
    contenido = await archivo.read()
    if len(contenido) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El archivo supera el tamaño máximo permitido de 2 MB (recibido: {len(contenido) / (1024*1024):.2f} MB)."
        )

    # 3. Validación de números mágicos (magic bytes)
    if not parece_imagen(contenido):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Firma de archivo inválida. El contenido del archivo no corresponde a una imagen genuina."
        )

    # 4. Generación de nombre seguro único
    token_seguro = secrets.token_hex(8)
    nombre_archivo_seguro = f"{producto_id}-{token_seguro}{ext}"
    ruta_destino = os.path.join(UPLOAD_DIR, nombre_archivo_seguro)

    # 5. Guardado seguro en disco
    try:
        with open(ruta_destino, "wb") as f:
            f.write(contenido)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar el archivo en el servidor: {str(e)}"
        )

    # 6. Actualizar campo imagen_url en la base de datos
    url_relativa = f"/static/uploads/{nombre_archivo_seguro}"
    producto.imagen_url = url_relativa

    try:
        db.commit()
        db.refresh(producto)
        return producto
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar imagen_url en la base de datos.")
