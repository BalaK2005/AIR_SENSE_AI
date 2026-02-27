"""
Alert Model
Database model for user alerts and notifications
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class AlertType(str, enum.Enum):
    """Alert type enumeration"""
    AQI_THRESHOLD = "aqi_threshold"
    HEALTH_WARNING = "health_warning"
    FORECAST_WARNING = "forecast_warning"
    POLICY_UPDATE = "policy_update"
    SYSTEM_NOTIFICATION = "system_notification"


class AlertSeverity(str, enum.Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


class AlertStatus(str, enum.Enum):
    """Alert status"""
    PENDING = "pending"
    SENT = "sent"
    READ = "read"
    DISMISSED = "dismissed"


class Alert(Base):
    """
    Alert model for storing user notifications and health alerts
    """
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Alert details
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    alert_type = Column(Enum(AlertType), nullable=False, index=True)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.INFO, nullable=False)
    status = Column(Enum(AlertStatus), default=AlertStatus.PENDING, nullable=False, index=True)
    
    # Location information
    location = Column(String(255), nullable=True)
    latitude = Column(String(50), nullable=True)
    longitude = Column(String(50), nullable=True)
    
    # Associated data
    aqi_value = Column(Integer, nullable=True)
    station_id = Column(String(100), nullable=True)
    
    # Delivery channels
    send_push = Column(Boolean, default=True)
    send_email = Column(Boolean, default=False)
    send_sms = Column(Boolean, default=False)
    
    # Delivery status
    push_sent = Column(Boolean, default=False)
    email_sent = Column(Boolean, default=False)
    sms_sent = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    sent_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    dismissed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    # Action data (for interactive alerts)
    action_url = Column(String(500), nullable=True)
    action_data = Column(Text, nullable=True)  # JSON data
    
    # Relationship
    user = relationship("User", back_populates="alerts")
    
    def __repr__(self):
        return f"<Alert(id={self.id}, user_id={self.user_id}, type={self.alert_type}, severity={self.severity})>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "message": self.message,
            "alert_type": self.alert_type.value if self.alert_type else None,
            "severity": self.severity.value if self.severity else None,
            "status": self.status.value if self.status else None,
            "location": self.location,
            "aqi_value": self.aqi_value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "read_at": self.read_at.isoformat() if self.read_at else None
        }
    
    def mark_as_sent(self):
        """Mark alert as sent"""
        self.status = AlertStatus.SENT
        self.sent_at = datetime.utcnow()
    
    def mark_as_read(self):
        """Mark alert as read"""
        self.status = AlertStatus.READ
        self.read_at = datetime.utcnow()
    
    def mark_as_dismissed(self):
        """Mark alert as dismissed"""
        self.status = AlertStatus.DISMISSED
        self.dismissed_at = datetime.utcnow()


class AlertPreference(Base):
    """
    User preferences for alerts
    """
    __tablename__ = "alert_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    
    # General preferences
    alerts_enabled = Column(Boolean, default=True)
    
    # AQI threshold preferences
    aqi_threshold = Column(Integer, default=200)  # Alert when AQI exceeds this
    threshold_alerts_enabled = Column(Boolean, default=True)
    
    # Health alerts
    health_alerts_enabled = Column(Boolean, default=True)
    sensitive_group = Column(Boolean, default=False)  # User is in sensitive group
    
    # Forecast alerts
    forecast_alerts_enabled = Column(Boolean, default=True)
    forecast_hours_ahead = Column(Integer, default=24)
    
    # Policy alerts
    policy_alerts_enabled = Column(Boolean, default=False)
    
    # Notification channels
    push_notifications = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    
    # Quiet hours
    quiet_hours_enabled = Column(Boolean, default=False)
    quiet_hours_start = Column(String(5), nullable=True)  # HH:MM format
    quiet_hours_end = Column(String(5), nullable=True)    # HH:MM format
    
    # Location-based alerts
    location_based_alerts = Column(Boolean, default=True)
    alert_radius_km = Column(Integer, default=5)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<AlertPreference(user_id={self.user_id}, threshold={self.aqi_threshold})>"


class AlertTemplate(Base):
    """
    Templates for different types of alerts
    """
    __tablename__ = "alert_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(100), nullable=False, unique=True)
    alert_type = Column(Enum(AlertType), nullable=False)
    severity = Column(Enum(AlertSeverity), nullable=False)
    
    # Template content
    title_template = Column(String(255), nullable=False)
    message_template = Column(Text, nullable=False)
    
    # Supported placeholders (JSON array)
    placeholders = Column(Text, nullable=True)
    
    # Active status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<AlertTemplate(name='{self.name}', type={self.alert_type})>"


class NotificationLog(Base):
    """
    Log of all notifications sent
    """
    __tablename__ = "notification_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Delivery details
    channel = Column(String(20), nullable=False)  # push, email, sms
    status = Column(String(20), nullable=False)   # sent, failed, delivered, read
    
    # Provider information
    provider = Column(String(50), nullable=True)  # Firebase, SendGrid, Twilio, etc.
    provider_message_id = Column(String(255), nullable=True)
    
    # Response/Error
    response_code = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<NotificationLog(id={self.id}, alert_id={self.alert_id}, channel={self.channel}, status={self.status})>"