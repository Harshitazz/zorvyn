from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, records, dashboard, users
from app.core.config import config
from app.core.http import api_error, http_exception_handler, unhandled_exception_handler
from app.db.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title=config.APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request, exc: RequestValidationError):
    return api_error("Validation failed", 422, exc.errors())


@app.get("/api/health")
def health():
    return {
        "success": True,
        "message": "Server healthy",
        "data": {"status": "ok", "docs": "/docs", "version": "1.0.0"},
    }


app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(records.router)
app.include_router(users.router)
