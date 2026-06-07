from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database (Supabase PostgreSQL)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/ecoview"

    # Firebase Admin SDK
    FIREBASE_SERVICE_ACCOUNT_PATH: str = "firebase-service-account.json"

    # Cloudflare R2
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "ecoview-images"
    R2_PUBLIC_URL: str = ""

    # Upstash Redis
    REDIS_URL: str = "redis://localhost:6379"

    # App
    ENVIRONMENT: str = "development"
    MAX_IMAGE_SIZE_MB: int = 10

    # ML Backend Microservice
    ML_BACKEND_URL: str = "http://localhost:8080"


settings = Settings()
