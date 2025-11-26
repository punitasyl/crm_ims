from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from app.config import settings

# Create database engine
# SQLite doesn't support pool_size and max_overflow
if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite configuration for better concurrency
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={
            "check_same_thread": False,  # Needed for SQLite
            "timeout": 20  # Wait up to 20 seconds for lock to be released
        },
        poolclass=NullPool,  # Use NullPool for SQLite to avoid connection pooling issues
    )
    
    # Enable WAL mode for better concurrency
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

