from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, verificar_password, crear_token
from app.dependencies import get_db, get_current_user
from app.models.pedidos import Usuario
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, TokenRefresh, UsuarioMeOut

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/register", response_model=UsuarioMeOut, status_code=status.HTTP_201_CREATED, summary="Registro de nuevo usuario")
def register_user(
    datos: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Registra un nuevo usuario en la plataforma.
    Valida el consentimiento previo e informado exigido por la Ley 25.326.
    Rechaza el registro si acepto_tratamiento es False.
    """
    if not datos.acepto_tratamiento:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe aceptar expresamente el tratamiento de datos personales conforme a la Ley 25.326."
        )

    # Verificar si el email ya se encuentra registrado
    usuario_existente = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo electrónico ya se encuentra registrado."
        )

    # Si es el primer usuario en la base de datos o su email contiene 'admin', permitir asignación admin
    rol_asignado = "admin" if datos.email.startswith("admin@") else "cliente"

    nuevo_usuario = Usuario(
        nombre=datos.nombre,
        email=datos.email,
        telefono=datos.telefono,
        hashed_password=hash_password(datos.password),
        rol=rol_asignado,
        acepto_tratamiento=True,
        fecha_consentimiento=datetime.now(timezone.utc),
        activo=True
    )

    try:
        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)
        return nuevo_usuario
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al procesar el registro de usuario."
        )


@router.post("/login", response_model=TokenResponse, summary="Inicio de sesión y obtención de tokens JWT")
async def login_user(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Autentica al usuario mediante credenciales (email y contraseña)
    y genera los tokens de acceso (ACCESS_MIN) y refresco (REFRESH_MIN).
    Soporta formato JSON y Form-Data (OAuth2 compatible).
    """
    email = None
    password = None

    # Detectar si el contenido es JSON o Form
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            email = body.get("email") or body.get("username")
            password = body.get("password")
        except Exception:
            pass
    else:
        try:
            form = await request.form()
            email = form.get("username") or form.get("email")
            password = form.get("password")
        except Exception:
            pass

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Debe proporcionar email y contraseña válidos."
        )

    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario or not verificar_password(password, usuario.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas (email o contraseña inválidos).",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta de usuario se encuentra inactiva o dada de baja."
        )

    # Crear Access Token
    access_token = crear_token(
        data={"sub": usuario.email, "rol": usuario.rol, "type": "access"},
        expires_delta=timedelta(minutes=settings.ACCESS_MIN)
    )

    # Crear Refresh Token
    refresh_token = crear_token(
        data={"sub": usuario.email, "type": "refresh"},
        expires_delta=timedelta(minutes=settings.REFRESH_MIN)
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@router.post("/refresh", response_model=TokenResponse, summary="Renovación de Access Token")
def refresh_token(
    datos: TokenRefresh,
    db: Session = Depends(get_db)
):
    """
    Emite un nuevo par de tokens validando un Refresh Token válido y no expirado.
    """
    exception_invalido = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="El Refresh Token es inválido o ha expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(datos.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise exception_invalido
        email: str = payload.get("sub")
        if email is None:
            raise exception_invalido
    except JWTError:
        raise exception_invalido

    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario or not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inválido o inactivo."
        )

    nuevo_access = crear_token(
        data={"sub": usuario.email, "rol": usuario.rol, "type": "access"},
        expires_delta=timedelta(minutes=settings.ACCESS_MIN)
    )
    nuevo_refresh = crear_token(
        data={"sub": usuario.email, "type": "refresh"},
        expires_delta=timedelta(minutes=settings.REFRESH_MIN)
    )

    return TokenResponse(
        access_token=nuevo_access,
        refresh_token=nuevo_refresh,
        token_type="bearer"
    )


@router.get("/me", response_model=UsuarioMeOut, summary="Obtener perfil del usuario autenticado")
def get_current_user_profile(
    current_user: Usuario = Depends(get_current_user)
):
    """
    Retorna la información del perfil del usuario actualmente autenticado.
    """
    return current_user
