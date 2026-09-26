import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL_SYNC = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL_SYNC,
    pool_pre_ping=True,   # checks connection is alive before using it
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_sync_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()