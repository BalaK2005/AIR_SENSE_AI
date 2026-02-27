"""
Notification Service
Handles push notifications, email, and SMS alerts
"""

import logging
from typing import List, Dict, Optional, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.alert import Alert, AlertStatus, NotificationLog
from app.models.user import User

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service for sending notifications through various channels
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.firebase_app = self._init_firebase()
    
    def _init_firebase(self):
        """
        Initialize Firebase for push notifications
        
        Returns:
            Firebase app instance or None
        """
        if not settings.ENABLE_PUSH_NOTIFICATIONS:
            return None
        
        try:
            import firebase_admin
            from firebase_admin import credentials
            
            if settings.FIREBASE_CREDENTIALS_PATH:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                app = firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized successfully")
                return app
            else:
                logger.warning("Firebase credentials not configured")
                return None
        except Exception as e:
            logger.error(f"Error initializing Firebase: {e}")
            return None
    
    def send_push_notification(
        self,
        user_id: int,
        title: str,
        message: str,
        data: Optional[Dict] = None
    ) -> bool:
        """
        Send push notification to user's device
        
        Args:
            user_id: User ID
            title: Notification title
            message: Notification message
            data: Additional data payload
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.firebase_app:
            logger.warning("Firebase not initialized, cannot send push notification")
            return False
        
        try:
            from firebase_admin import messaging
            
            # Get user's FCM token from database
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.error(f"User {user_id} not found")
                return False
            
            # In production, store FCM tokens in user table
            # For now, this is a placeholder
            fcm_token = getattr(user, 'fcm_token', None)
            
            if not fcm_token:
                logger.warning(f"No FCM token for user {user_id}")
                return False
            
            # Create message
            notification = messaging.Notification(
                title=title,
                body=message
            )
            
            message = messaging.Message(
                notification=notification,
                data=data or {},
                token=fcm_token
            )
            
            # Send message
            response = messaging.send(message)
            logger.info(f"Push notification sent to user {user_id}: {response}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending push notification: {e}")
            return False
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html: Optional[str] = None
    ) -> bool:
        """
        Send email notification
        
        Args:
            to_email: Recipient email
            subject: Email subject
            body: Plain text body
            html: HTML body (optional)
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not settings.SMTP_HOST:
            logger.warning("SMTP not configured, cannot send email")
            return False
        
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = settings.EMAIL_FROM
            msg['To'] = to_email
            
            # Add plain text part
            text_part = MIMEText(body, 'plain')
            msg.attach(text_part)
            
            # Add HTML part if provided
            if html:
                html_part = MIMEText(html, 'html')
                msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Email sent to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False
    
    def send_sms(self, phone_number: str, message: str) -> bool:
        """
        Send SMS notification
        
        Args:
            phone_number: Recipient phone number
            message: SMS message
            
        Returns:
            True if sent successfully, False otherwise
        """
        # Placeholder for SMS implementation
        # In production, integrate with Twilio, AWS SNS, or similar
        logger.info(f"SMS would be sent to {phone_number}: {message}")
        return True
    
    def send_alert(self, alert_id: int) -> Dict[str, bool]:
        """
        Send alert through configured channels
        
        Args:
            alert_id: Alert ID
            
        Returns:
            Dictionary with delivery status for each channel
        """
        # Get alert from database
        alert = self.db.query(Alert).filter(Alert.id == alert_id).first()
        
        if not alert:
            logger.error(f"Alert {alert_id} not found")
            return {"error": True}
        
        # Get user
        user = self.db.query(User).filter(User.id == alert.user_id).first()
        
        if not user:
            logger.error(f"User {alert.user_id} not found")
            return {"error": True}
        
        results = {}
        
        # Send push notification
        if alert.send_push and user.push_notifications:
            success = self.send_push_notification(
                user_id=user.id,
                title=alert.title,
                message=alert.message,
                data={"alert_id": alert_id, "type": alert.alert_type.value}
            )
            results["push"] = success
            alert.push_sent = success
            
            # Log notification
            self._log_notification(alert_id, user.id, "push", success)
        
        # Send email
        if alert.send_email and user.email_notifications:
            success = self.send_email(
                to_email=user.email,
                subject=alert.title,
                body=alert.message
            )
            results["email"] = success
            alert.email_sent = success
            
            # Log notification
            self._log_notification(alert_id, user.id, "email", success)
        
        # Send SMS
        if alert.send_sms and user.phone_number:
            success = self.send_sms(
                phone_number=user.phone_number,
                message=f"{alert.title}: {alert.message}"
            )
            results["sms"] = success
            alert.sms_sent = success
            
            # Log notification
            self._log_notification(alert_id, user.id, "sms", success)
        
        # Update alert status
        if any(results.values()):
            alert.mark_as_sent()
        
        self.db.commit()
        
        return results
    
    def _log_notification(
        self,
        alert_id: int,
        user_id: int,
        channel: str,
        success: bool
    ):
        """
        Log notification delivery
        
        Args:
            alert_id: Alert ID
            user_id: User ID
            channel: Delivery channel
            success: Whether delivery was successful
        """
        try:
            log = NotificationLog(
                alert_id=alert_id,
                user_id=user_id,
                channel=channel,
                status="sent" if success else "failed",
                sent_at=datetime.utcnow()
            )
            self.db.add(log)
            self.db.commit()
        except Exception as e:
            logger.error(f"Error logging notification: {e}")
    
    def create_aqi_alert(
        self,
        user_id: int,
        station_name: str,
        aqi_value: float,
        category: str,
        location: Optional[str] = None
    ) -> Optional[int]:
        """
        Create AQI threshold alert
        
        Args:
            user_id: User ID
            station_name: Station name
            aqi_value: Current AQI value
            category: AQI category
            location: Location name
            
        Returns:
            Alert ID if created, None otherwise
        """
        try:
            # Determine severity
            if aqi_value > 400:
                severity = "emergency"
            elif aqi_value > 300:
                severity = "critical"
            elif aqi_value > 200:
                severity = "warning"
            else:
                severity = "info"
            
            # Create alert
            alert = Alert(
                user_id=user_id,
                title=f"High AQI Alert - {category}",
                message=f"Air quality at {station_name} is {category} with AQI {aqi_value:.0f}. {self._get_health_advice(category)}",
                alert_type="aqi_threshold",
                severity=severity,
                location=location or station_name,
                aqi_value=int(aqi_value),
                station_id=station_name
            )
            
            self.db.add(alert)
            self.db.commit()
            self.db.refresh(alert)
            
            # Send immediately
            self.send_alert(alert.id)
            
            return alert.id
            
        except Exception as e:
            logger.error(f"Error creating AQI alert: {e}")
            self.db.rollback()
            return None
    
    def _get_health_advice(self, category: str) -> str:
        """Get health advice based on AQI category"""
        advice = {
            "Good": "Enjoy outdoor activities!",
            "Satisfactory": "Normal activities can continue.",
            "Moderate": "Sensitive individuals should limit prolonged outdoor exertion.",
            "Poor": "Avoid prolonged outdoor activities. Wear a mask if going outside.",
            "Very Poor": "Minimize outdoor exposure. Use air purifiers indoors.",
            "Severe": "Avoid all outdoor activities. Stay indoors with air purifiers."
        }
        return advice.get(category, "Monitor air quality conditions.")
    
    def send_forecast_alert(
        self,
        user_id: int,
        station_name: str,
        forecasted_aqi: float,
        hours_ahead: int
    ) -> Optional[int]:
        """
        Send forecast alert
        
        Args:
            user_id: User ID
            station_name: Station name
            forecasted_aqi: Forecasted AQI
            hours_ahead: Hours ahead
            
        Returns:
            Alert ID if created, None otherwise
        """
        try:
            category = self._get_category(forecasted_aqi)
            
            alert = Alert(
                user_id=user_id,
                title=f"AQI Forecast Alert",
                message=f"Air quality at {station_name} is expected to be {category} (AQI {forecasted_aqi:.0f}) in {hours_ahead} hours. Plan accordingly.",
                alert_type="forecast_warning",
                severity="warning" if forecasted_aqi > 200 else "info",
                location=station_name,
                aqi_value=int(forecasted_aqi),
                station_id=station_name
            )
            
            self.db.add(alert)
            self.db.commit()
            self.db.refresh(alert)
            
            self.send_alert(alert.id)
            
            return alert.id
            
        except Exception as e:
            logger.error(f"Error creating forecast alert: {e}")
            self.db.rollback()
            return None
    
    def _get_category(self, aqi: float) -> str:
        """Get AQI category from value"""
        if aqi <= 50:
            return "Good"
        elif aqi <= 100:
            return "Satisfactory"
        elif aqi <= 200:
            return "Moderate"
        elif aqi <= 300:
            return "Poor"
        elif aqi <= 400:
            return "Very Poor"
        else:
            return "Severe"
    
    def broadcast_alert(
        self,
        title: str,
        message: str,
        alert_type: str = "system_notification",
        region: Optional[str] = None
    ) -> int:
        """
        Broadcast alert to multiple users
        
        Args:
            title: Alert title
            message: Alert message
            alert_type: Type of alert
            region: Target region (optional)
            
        Returns:
            Number of users notified
        """
        query = self.db.query(User).filter(User.is_active == True)
        
        if region:
            query = query.filter(User.location.contains(region))
        
        users = query.all()
        
        count = 0
        for user in users:
            try:
                alert = Alert(
                    user_id=user.id,
                    title=title,
                    message=message,
                    alert_type=alert_type,
                    severity="info"
                )
                
                self.db.add(alert)
                self.db.commit()
                self.db.refresh(alert)
                
                self.send_alert(alert.id)
                count += 1
                
            except Exception as e:
                logger.error(f"Error sending broadcast to user {user.id}: {e}")
                continue
        
        logger.info(f"Broadcast sent to {count} users")
        return count