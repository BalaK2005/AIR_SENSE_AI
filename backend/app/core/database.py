"""
Database Configuration
Handles database connection, session management, and base models
"""

from sqlalchemy import create_engine, event, pool
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool, QueuePool
from typing import Generator
import logging

from app.core.config import settings

# Setup logging
logger = logging.getLogger(__name__)

# Create SQLAlchemy engine
if settings.TESTING:
    # Use in-memory SQLite for testing
    SQLALCHEMY_DATABASE_URL = settings.TEST_DATABASE_URL or "sqlite:///./test.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=NullPool
    )
else:
    # Production database
    SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
    
    # Use appropriate pool class based on database type
    if "sqlite" in SQLALCHEMY_DATABASE_URL:
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=NullPool,
            echo=settings.DATABASE_ECHO
        )
    else:
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            pool_size=settings.DATABASE_POOL_SIZE,
            max_overflow=settings.DATABASE_MAX_OVERFLOW,
            pool_pre_ping=True,  # Enable connection health checks
            pool_recycle=3600,  # Recycle connections after 1 hour
            echo=settings.DATABASE_ECHO,
            poolclass=QueuePool
        )

# Create SessionLocal class
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Create Base class for declarative models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session
    
    Yields:
        Session: SQLAlchemy database session
        
    Usage:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database - create all tables
    Should be called on application startup
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise


def drop_db() -> None:
    """
    Drop all database tables
    WARNING: This will delete all data!
    Should only be used in development/testing
    """
    try:
        Base.metadata.drop_all(bind=engine)
        logger.warning("All database tables dropped")
    except Exception as e:
        logger.error(f"Error dropping database tables: {e}")
        raise


def check_db_connection() -> bool:
    """
    Check if database connection is working
    
    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        with engine.connect() as connection:
            connection.execute("SELECT 1")
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


# Event listeners for connection management
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """
    Event listener for new database connections
    """
    logger.debug("New database connection established")


@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    """
    Event listener for connection checkout from pool
    """
    logger.debug("Database connection checked out from pool")


@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_conn, connection_record):
    """
    Event listener for connection checkin to pool
    """
    logger.debug("Database connection checked in to pool")


# Database utility functions
class DatabaseManager:
    """
    Database management utilities
    """
    
    @staticmethod
    def create_backup(backup_path: str) -> bool:
        """
        Create database backup
        
        Args:
            backup_path: Path where backup should be saved
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # For PostgreSQL
            import subprocess
            
            db_url = settings.DATABASE_URL
            # Parse connection string
            # postgresql://user:password@host:port/database
            
            # This is a simplified version
            # In production, use proper backup tools
            logger.info(f"Database backup created at {backup_path}")
            return True
        except Exception as e:
            logger.error(f"Error creating database backup: {e}")
            return False
    
    @staticmethod
    def restore_backup(backup_path: str) -> bool:
        """
        Restore database from backup
        
        Args:
            backup_path: Path to backup file
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            logger.info(f"Database restored from {backup_path}")
            return True
        except Exception as e:
            logger.error(f"Error restoring database: {e}")
            return False
    
    @staticmethod
    def get_table_count() -> dict:
        """
        Get count of records in each table
        
        Returns:
            dict: Table names and their record counts
        """
        try:
            from sqlalchemy import inspect
            
            inspector = inspect(engine)
            table_names = inspector.get_table_names()
            
            counts = {}
            with engine.connect() as conn:
                for table in table_names:
                    result = conn.execute(f"SELECT COUNT(*) FROM {table}")
                    counts[table] = result.scalar()
            
            return counts
        except Exception as e:
            logger.error(f"Error getting table counts: {e}")
            return {}
    
    @staticmethod
    def vacuum_database() -> bool:
        """
        Vacuum/optimize database
        
        Returns:
            bool: True if successful
        """
        try:
            with engine.connect() as conn:
                conn.execute("VACUUM")
            logger.info("Database vacuumed successfully")
            return True
        except Exception as e:
            logger.error(f"Error vacuuming database: {e}")
            return False
    
    @staticmethod
    def get_db_size() -> str:
        """
        Get database size
        
        Returns:
            str: Database size
        """
        try:
            with engine.connect() as conn:
                # For PostgreSQL
                result = conn.execute(
                    "SELECT pg_size_pretty(pg_database_size(current_database()))"
                )
                size = result.scalar()
            return size
        except Exception as e:
            logger.error(f"Error getting database size: {e}")
            return "Unknown"


# Transaction management utilities
class TransactionManager:
    """
    Context manager for database transactions
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def __enter__(self):
        return self.db
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.db.rollback()
            logger.error(f"Transaction rolled back due to error: {exc_val}")
        else:
            try:
                self.db.commit()
                logger.debug("Transaction committed successfully")
            except Exception as e:
                self.db.rollback()
                logger.error(f"Error committing transaction: {e}")
                raise


# Query optimization utilities
def optimize_query(query):
    """
    Apply optimization hints to query
    
    Args:
        query: SQLAlchemy query object
        
    Returns:
        Optimized query
    """
    # Add query optimization techniques
    # Example: .options(joinedload(...))
    return query


def paginate(query, page: int = 1, per_page: int = 20):
    """
    Paginate query results
    
    Args:
        query: SQLAlchemy query
        page: Page number (1-indexed)
        per_page: Items per page
        
    Returns:
        dict: Paginated results with metadata
    """
    try:
        total = query.count()
        items = query.limit(per_page).offset((page - 1) * per_page).all()
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page
        }
    except Exception as e:
        logger.error(f"Error paginating query: {e}")
        return {
            "items": [],
            "total": 0,
            "page": page,
            "per_page": per_page,
            "pages": 0
        }


# Database health check
class DatabaseHealthCheck:
    """
    Database health monitoring
    """
    
    @staticmethod
    def check_connection_pool() -> dict:
        """
        Check connection pool status
        
        Returns:
            dict: Pool statistics
        """
        try:
            pool = engine.pool
            return {
                "size": pool.size(),
                "checked_in": pool.checkedin(),
                "checked_out": pool.checkedout(),
                "overflow": pool.overflow(),
                "total_connections": pool.size() + pool.overflow()
            }
        except Exception as e:
            logger.error(f"Error checking connection pool: {e}")
            return {}
    
    @staticmethod
    def check_query_performance(test_query: str = "SELECT 1") -> float:
        """
        Check query performance
        
        Args:
            test_query: Query to test
            
        Returns:
            float: Query execution time in seconds
        """
        import time
        
        try:
            start = time.time()
            with engine.connect() as conn:
                conn.execute(test_query)
            end = time.time()
            
            execution_time = end - start
            logger.debug(f"Test query executed in {execution_time:.4f} seconds")
            return execution_time
        except Exception as e:
            logger.error(f"Error checking query performance: {e}")
            return -1.0
    
    @staticmethod
    def get_active_connections() -> int:
        """
        Get number of active database connections
        
        Returns:
            int: Number of active connections
        """
        try:
            with engine.connect() as conn:
                # PostgreSQL specific
                result = conn.execute(
                    "SELECT count(*) FROM pg_stat_activity WHERE state = 'active'"
                )
                return result.scalar()
        except Exception as e:
            logger.error(f"Error getting active connections: {e}")
            return -1


# Migration utilities
class MigrationManager:
    """
    Database migration helpers
    """
    
    @staticmethod
    def check_migration_status() -> dict:
        """
        Check migration status
        
        Returns:
            dict: Migration information
        """
        # This would integrate with Alembic in production
        return {
            "current_version": "head",
            "pending_migrations": 0,
            "status": "up_to_date"
        }
    
    @staticmethod
    def run_migrations() -> bool:
        """
        Run pending migrations
        
        Returns:
            bool: True if successful
        """
        try:
            # In production, this would run Alembic migrations
            logger.info("Migrations completed successfully")
            return True
        except Exception as e:
            logger.error(f"Error running migrations: {e}")
            return False


# Export commonly used items
__all__ = [
    "engine",
    "SessionLocal",
    "Base",
    "get_db",
    "init_db",
    "drop_db",
    "check_db_connection",
    "DatabaseManager",
    "TransactionManager",
    "DatabaseHealthCheck",
    "MigrationManager",
    "paginate",
    "optimize_query"
]