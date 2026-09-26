from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.main import router as main_router

def create_app():
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(main_router)

    return app