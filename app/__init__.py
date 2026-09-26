from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.reminders.scheduler import start_scheduler
from app.routes.main import router as main_router
from app.routes.medcine import router as medicine_router

def create_app():
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        scheduler = start_scheduler()
        app.state.reminder_scheduler = scheduler
        try:
            yield
        finally:
            scheduler.shutdown(wait=False)

    app = FastAPI(lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(main_router)
    app.include_router(medicine_router)

    return app