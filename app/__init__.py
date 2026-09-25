from fastapi import FastAPI

from app.routes.main import router as main_router

def create_app():
    app = FastAPI()

    app.include_router(main_router)
    
    return app