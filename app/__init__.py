from fastapi import FastAPI

from app.routes.main import router as main_router
from app.prescription.get_Schedule import router as get_schedule

def create_app():
    app = FastAPI()

    app.include_router(main_router)
    app.include_router(get_schedule)
    
    return app