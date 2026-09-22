from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100, description="Nombre completo del titular")
    email: EmailStr = Field(..., description="Correo electrónico único del usuario")
    password: str = Field(..., min_length=6, description="Contraseña segura (mínimo 6 caracteres)")
    telefono: Optional[str] = Field(default=None, max_length=50)
    acepto_tratamiento: bool = Field(..., description="Consentimiento expreso e informado según Ley 25.326")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class UsuarioMeOut(BaseModel):
    id: int
    nombre: str
    email: str
    telefono: Optional[str] = None
    rol: str
    activo: bool
    acepto_tratamiento: bool
    fecha_consentimiento: Optional[datetime] = None
    fecha_baja: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
