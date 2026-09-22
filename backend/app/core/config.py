import json
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Dulce Vicio - Pastelería Artesanal API"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ecommerce_db"
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000,http://127.0.0.1:8000,http://localhost:5173"
    
    # Configuración de Seguridad y JWT
    SECRET_KEY: str = "dulce-vicio-secret-key-super-segura-2026-cambiar-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_MIN: int = 30
    REFRESH_MIN: int = 60 * 24 * 7  # 7 días en minutos

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def origins(self) -> List[str]:
        """
        Procesa CORS_ORIGINS y retorna una lista limpia de strings.
        Soporta formato JSON lista '["http://..."]' o cadenas separadas por coma.
        """
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        if isinstance(self.CORS_ORIGINS, str):
            val = self.CORS_ORIGINS.strip()
            if val.startswith("[") and val.endswith("]"):
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, list):
                        return [str(origin).strip() for origin in parsed if str(origin).strip()]
                except json.JSONDecodeError:
                    pass
            return [item.strip() for item in val.split(",") if item.strip()]
        return ["*"]


settings = Settings()
