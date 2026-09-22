import json
import uuid
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.dependencies import get_db, get_current_user
from app.models.pedidos import Usuario, Pedido

router = APIRouter(prefix="/usuarios", tags=["Usuarios & Ley 25.326 (Datos Personales)"])


@router.get("/me/datos", summary="Consultar todos los datos personales (Ley 25.326 Art. 14 - Derecho de Acceso)")
def obtener_mis_datos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Permite al titular del dato ejercer su Derecho de Acceso (Ley 25.326),
    obteniendo toda la información registrada a su nombre en la plataforma.
    """
    pedidos_db = db.query(Pedido).filter(Pedido.usuario_id == current_user.id).all()
    pedidos_resumen = [
        {
            "id": p.id,
            "total": float(p.total),
            "estado": p.estado,
            "fecha_creacion": p.fecha_creacion.isoformat() if p.fecha_creacion else None,
            "cantidad_items": len(p.items)
        }
        for p in pedidos_db
    ]

    return {
        "aviso_legal": "Información provista en cumplimiento del Art. 14 de la Ley Nacional N° 25.326 de Protección de Datos Personales.",
        "titular": {
            "id": current_user.id,
            "nombre": current_user.nombre,
            "email": current_user.email,
            "telefono": current_user.telefono,
            "rol": current_user.rol,
            "acepto_tratamiento": current_user.acepto_tratamiento,
            "fecha_consentimiento": current_user.fecha_consentimiento.isoformat() if current_user.fecha_consentimiento else None,
            "activo": current_user.activo,
            "fecha_baja": current_user.fecha_baja.isoformat() if current_user.fecha_baja else None
        },
        "historial_pedidos": pedidos_resumen
    }


@router.get("/me/exportar", summary="Exportar datos personales en formato JSON (Portabilidad Ley 25.326)")
def exportar_mis_datos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Genera un archivo descargable con Content-Disposition para portabilidad de datos personales.
    """
    pedidos_db = db.query(Pedido).filter(Pedido.usuario_id == current_user.id).all()
    data_export = {
        "exportado_en": datetime.now(timezone.utc).isoformat(),
        "marco_normativo": "Ley 25.326 de Protección de Datos Personales (República Argentina)",
        "usuario": {
            "id": current_user.id,
            "nombre": current_user.nombre,
            "email": current_user.email,
            "telefono": current_user.telefono,
            "rol": current_user.rol,
            "consentimiento_tratamiento": current_user.acepto_tratamiento,
            "fecha_consentimiento": current_user.fecha_consentimiento.isoformat() if current_user.fecha_consentimiento else None,
            "activo": current_user.activo
        },
        "pedidos": [
            {
                "id": p.id,
                "total": float(p.total),
                "estado": p.estado,
                "fecha_creacion": p.fecha_creacion.isoformat() if p.fecha_creacion else None,
                "items": [
                    {
                        "producto_id": it.producto_id,
                        "cantidad": it.cantidad,
                        "precio_unitario": float(it.precio_unitario)
                    }
                    for it in p.items
                ]
            }
            for p in pedidos_db
        ]
    }

    contenido_json = json.dumps(data_export, indent=2, ensure_ascii=False)
    filename = f"datos_usuario_{current_user.id}.json"

    return Response(
        content=contenido_json,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.delete("/me", summary="Derecho de Supresión/Cancelación (Ley 25.326 Art. 16 - Derecho al Olvido)")
def dar_de_baja_usuario(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Ejecuta el derecho de cancelación y supresión de datos personales (Art. 16 Ley 25.326):
    - Anonimiza nombre, email y teléfono.
    - Neutraliza y rehashea la clave con valor aleatorio inaccesible.
    - Establece activo=False y registra fecha_baja.
    - Preserva los registros en la base de datos para no romper integridad referencial contable.
    """
    token_anon = uuid.uuid4().hex[:8]

    current_user.nombre = "Usuario Anonimizado"
    current_user.email = f"anonimo_{token_anon}@baja.dulcevicio.local"
    current_user.telefono = None
    # Neutralizar contraseña con valor aleatorio desechado
    current_user.hashed_password = hash_password(secrets.token_hex(32))
    current_user.activo = False
    current_user.fecha_baja = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(current_user)
        return {
            "mensaje": "Cuenta dada de baja y datos personales anonimizados con éxito conforme a la Ley 25.326.",
            "usuario_id": current_user.id,
            "activo": current_user.activo,
            "fecha_baja": current_user.fecha_baja
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la anonimización de la cuenta."
        )
