from app.core.database import Base, engine
from app.models.user import User, SavedLocation
from app.models.aqi_data import AQIData, AQIForecast, AQIHistory
from app.models.alert import Alert, AlertPreference, AlertTemplate, NotificationLog
from app.models.policy import Policy, PolicyLog, PolicyRecommendation, PolicySimulation, PolicyFeedback

def init_database():
    """Initialize database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_database()