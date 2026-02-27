"""
Policy Model
Database model for policy tracking and impact analysis
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum, Boolean, JSON
from datetime import datetime
import enum

from app.core.database import Base


class PolicyCategory(str, enum.Enum):
    """Policy category enumeration"""
    TRAFFIC_MANAGEMENT = "traffic_management"
    INDUSTRIAL_REGULATION = "industrial_regulation"
    CONSTRUCTION_CONTROL = "construction_control"
    BIOMASS_BURNING_BAN = "biomass_burning_ban"
    ODD_EVEN_SCHEME = "odd_even_scheme"
    PUBLIC_TRANSPORT = "public_transport"
    GREEN_ZONE = "green_zone"
    EMISSION_STANDARDS = "emission_standards"
    WASTE_MANAGEMENT = "waste_management"
    VEHICLE_RESTRICTIONS = "vehicle_restrictions"
    EMERGENCY_MEASURES = "emergency_measures"


class PolicyStatus(str, enum.Enum):
    """Policy implementation status"""
    PROPOSED = "proposed"
    ACTIVE = "active"
    COMPLETED = "completed"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"


class PolicyImpactLevel(str, enum.Enum):
    """Expected impact level"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Policy(Base):
    """
    Policy model for tracking pollution control policies
    """
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    
    # Policy details
    policy_name = Column(String(255), nullable=False)
    policy_code = Column(String(50), unique=True, nullable=True, index=True)
    description = Column(Text, nullable=False)
    category = Column(Enum(PolicyCategory), nullable=False, index=True)
    
    # Region and scope
    region = Column(String(100), nullable=False, index=True)
    affected_areas = Column(JSON, nullable=True)  # List of affected areas
    scope = Column(String(50), nullable=True)  # city-wide, regional, local
    
    # Implementation details
    status = Column(Enum(PolicyStatus), default=PolicyStatus.PROPOSED, nullable=False, index=True)
    expected_impact = Column(Enum(PolicyImpactLevel), nullable=True)
    
    # Dates
    proposed_date = Column(DateTime, nullable=True)
    implemented_date = Column(DateTime, nullable=True, index=True)
    end_date = Column(DateTime, nullable=True)
    
    # Implementation by
    implemented_by = Column(String(255), nullable=True)
    authority = Column(String(255), nullable=True)  # Implementing authority
    
    # Cost and resources
    estimated_cost = Column(Float, nullable=True)
    actual_cost = Column(Float, nullable=True)
    budget_allocated = Column(Float, nullable=True)
    
    # Objectives and targets
    objectives = Column(Text, nullable=True)
    target_reduction_percentage = Column(Float, nullable=True)
    target_aqi = Column(Float, nullable=True)
    
    # Legal framework
    legal_reference = Column(String(255), nullable=True)
    enforcement_mechanism = Column(Text, nullable=True)
    penalties = Column(Text, nullable=True)
    
    # Stakeholders
    affected_sectors = Column(JSON, nullable=True)  # List of affected sectors
    stakeholder_feedback = Column(Text, nullable=True)
    
    # Additional metadata
    tags = Column(JSON, nullable=True)  # Search tags
    priority_level = Column(Integer, default=1)  # 1-5 scale
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Policy(id={self.id}, name='{self.policy_name}', status={self.status})>"
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "policy_name": self.policy_name,
            "policy_code": self.policy_code,
            "description": self.description,
            "category": self.category.value if self.category else None,
            "region": self.region,
            "status": self.status.value if self.status else None,
            "implemented_date": self.implemented_date.isoformat() if self.implemented_date else None,
            "target_reduction_percentage": self.target_reduction_percentage
        }


class PolicyLog(Base):
    """
    Detailed log of policy implementation and monitoring
    """
    __tablename__ = "policy_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Policy reference
    policy_id = Column(Integer, nullable=True, index=True)
    policy_name = Column(String(255), nullable=False)
    policy_code = Column(String(50), nullable=True)
    category = Column(String(50), nullable=False, index=True)
    
    # Location
    region = Column(String(100), nullable=False, index=True)
    
    # Implementation details
    implemented_date = Column(DateTime, nullable=False, index=True)
    implemented_by = Column(Integer, nullable=True)  # User ID
    
    # AQI measurements
    aqi_before = Column(Float, nullable=True)
    aqi_after = Column(Float, nullable=True)
    measurement_period_days = Column(Integer, default=30)
    
    # Pollutant levels before/after
    pm25_before = Column(Float, nullable=True)
    pm25_after = Column(Float, nullable=True)
    pm10_before = Column(Float, nullable=True)
    pm10_after = Column(Float, nullable=True)
    
    # Impact metrics
    reduction_percentage = Column(Float, nullable=True)
    effectiveness_score = Column(Float, nullable=True)  # 0-100 scale
    
    # Compliance
    compliance_rate = Column(Float, nullable=True)  # Percentage
    violations_count = Column(Integer, default=0)
    
    # Status and notes
    status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    challenges_faced = Column(Text, nullable=True)
    lessons_learned = Column(Text, nullable=True)
    
    # Monitoring data
    monitoring_stations = Column(JSON, nullable=True)
    data_sources = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<PolicyLog(id={self.id}, policy='{self.policy_name}', region='{self.region}')>"
    
    def calculate_reduction(self):
        """Calculate AQI reduction percentage"""
        if self.aqi_before and self.aqi_after:
            return ((self.aqi_before - self.aqi_after) / self.aqi_before) * 100
        return None


class PolicyRecommendation(Base):
    """
    AI-generated policy recommendations
    """
    __tablename__ = "policy_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Recommendation details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    
    # Target area
    region = Column(String(100), nullable=False, index=True)
    target_locations = Column(JSON, nullable=True)
    
    # Current situation
    current_aqi = Column(Float, nullable=False)
    problem_description = Column(Text, nullable=True)
    source_attribution = Column(JSON, nullable=True)
    
    # Recommendation specifics
    recommended_actions = Column(JSON, nullable=False)
    priority = Column(String(20), nullable=False)  # low, medium, high, critical
    estimated_impact = Column(String(100), nullable=True)
    implementation_cost = Column(String(50), nullable=True)
    timeframe = Column(String(100), nullable=True)
    
    # AI model information
    model_version = Column(String(50), nullable=True)
    confidence_score = Column(Float, nullable=True)
    generated_by = Column(String(50), default="AI", nullable=False)
    
    # Status
    is_reviewed = Column(Boolean, default=False)
    is_implemented = Column(Boolean, default=False)
    reviewed_by = Column(Integer, nullable=True)  # User ID
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    reviewed_at = Column(DateTime, nullable=True)
    implemented_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<PolicyRecommendation(id={self.id}, title='{self.title}', priority={self.priority})>"


class PolicySimulation(Base):
    """
    Policy impact simulations
    """
    __tablename__ = "policy_simulations"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Simulation details
    simulation_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Policies being simulated
    policies = Column(JSON, nullable=False)  # List of policy categories
    
    # Parameters
    region = Column(String(100), nullable=False)
    baseline_aqi = Column(Float, nullable=False)
    duration_days = Column(Integer, nullable=False)
    
    # Results
    projected_aqi = Column(JSON, nullable=True)  # Time series of AQI values
    predicted_reduction_percentage = Column(Float, nullable=True)
    final_aqi = Column(Float, nullable=True)
    
    # Model information
    model_version = Column(String(50), nullable=True)
    confidence_score = Column(Float, nullable=True)
    assumptions = Column(JSON, nullable=True)
    
    # Simulated by
    created_by = Column(Integer, nullable=True)  # User ID
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<PolicySimulation(id={self.id}, name='{self.simulation_name}')>"


class PolicyFeedback(Base):
    """
    Feedback on implemented policies
    """
    __tablename__ = "policy_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    
    policy_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=True)
    
    # Feedback
    rating = Column(Integer, nullable=True)  # 1-5 scale
    feedback_text = Column(Text, nullable=True)
    effectiveness_rating = Column(Integer, nullable=True)  # 1-5 scale
    
    # Impact on user
    personal_impact = Column(Text, nullable=True)
    compliance_difficulty = Column(Integer, nullable=True)  # 1-5 scale
    
    # Suggestions
    suggestions = Column(Text, nullable=True)
    
    # Metadata
    is_anonymous = Column(Boolean, default=False)
    sentiment = Column(String(20), nullable=True)  # positive, neutral, negative
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<PolicyFeedback(id={self.id}, policy_id={self.policy_id}, rating={self.rating})>"