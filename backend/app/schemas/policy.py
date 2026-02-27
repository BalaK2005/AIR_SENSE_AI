"""
Policy Schemas
Pydantic models for policy data validation
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class PolicyBase(BaseModel):
    """Base policy schema"""
    policy_name: str
    description: str
    category: str
    region: str


class PolicyCreate(PolicyBase):
    """Policy creation schema"""
    policy_code: Optional[str] = None
    scope: Optional[str] = None
    expected_impact: Optional[str] = None
    proposed_date: Optional[datetime] = None
    implemented_by: Optional[str] = None
    authority: Optional[str] = None
    estimated_cost: Optional[float] = None
    target_reduction_percentage: Optional[float] = None
    target_aqi: Optional[float] = None
    objectives: Optional[str] = None
    affected_sectors: Optional[List[str]] = None


class PolicyUpdate(BaseModel):
    """Policy update schema"""
    policy_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    implemented_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    actual_cost: Optional[float] = None
    notes: Optional[str] = None


class PolicyResponse(PolicyBase):
    """Policy response schema"""
    id: int
    policy_code: Optional[str] = None
    status: str
    expected_impact: Optional[str] = None
    implemented_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    target_reduction_percentage: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PolicyImpact(BaseModel):
    """Policy impact analysis"""
    policy_id: int
    policy_name: str
    category: str
    region: str
    implemented_date: datetime
    aqi_before: Optional[float] = None
    aqi_after: Optional[float] = None
    reduction_percentage: Optional[float] = None
    status: str
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True


class PolicyRecommendation(BaseModel):
    """AI-generated policy recommendation"""
    title: str
    description: str
    category: str
    priority: str = Field(description="low, medium, high, critical")
    estimated_impact: str
    implementation_cost: str
    timeframe: str
    affected_sectors: List[str]
    
    class Config:
        from_attributes = True


class SimulationRequest(BaseModel):
    """Policy simulation request"""
    policies: List[str] = Field(description="List of policy categories to simulate")
    region: str
    duration_days: int = Field(default=30, ge=1, le=365)
    baseline_aqi: Optional[float] = None
    
    @validator('policies')
    def validate_policies(cls, v):
        if not v or len(v) == 0:
            raise ValueError('At least one policy must be specified')
        return v


class PolicySimulation(BaseModel):
    """Policy simulation results"""
    policies: List[str]
    region: str
    baseline_aqi: float
    projected_aqi: List[float]
    predicted_reduction_percentage: float
    duration_days: int
    confidence_score: float
    assumptions: List[str]
    
    class Config:
        from_attributes = True


class PolicyLogCreate(BaseModel):
    """Policy log creation"""
    policy_name: str
    category: str
    region: str
    implemented_by: Optional[int] = None
    notes: Optional[str] = None


class PolicyLogUpdate(BaseModel):
    """Policy log update"""
    aqi_after: Optional[float] = None
    pm25_after: Optional[float] = None
    pm10_after: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    compliance_rate: Optional[float] = None
    violations_count: Optional[int] = None
    challenges_faced: Optional[str] = None
    lessons_learned: Optional[str] = None


class PolicyLogResponse(BaseModel):
    """Policy log response"""
    id: int
    policy_name: str
    category: str
    region: str
    implemented_date: datetime
    aqi_before: Optional[float] = None
    aqi_after: Optional[float] = None
    reduction_percentage: Optional[float] = None
    effectiveness_score: Optional[float] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class PolicyEffectiveness(BaseModel):
    """Policy effectiveness analysis"""
    category: Optional[str] = None
    region: Optional[str] = None
    total_policies: int
    avg_reduction_percentage: float
    median_reduction_percentage: float
    min_reduction_percentage: float
    max_reduction_percentage: float
    successful_policies: int
    
    class Config:
        from_attributes = True


class PolicyComparison(BaseModel):
    """Compare two policy scenarios"""
    scenario_a: Dict[str, Any]
    scenario_b: Dict[str, Any]
    recommendation: str
    difference_percentage: float


class PolicyFeedbackCreate(BaseModel):
    """Policy feedback creation"""
    policy_id: int
    rating: Optional[int] = Field(None, ge=1, le=5)
    feedback_text: Optional[str] = None
    effectiveness_rating: Optional[int] = Field(None, ge=1, le=5)
    personal_impact: Optional[str] = None
    compliance_difficulty: Optional[int] = Field(None, ge=1, le=5)
    suggestions: Optional[str] = None
    is_anonymous: bool = False


class PolicyFeedbackResponse(BaseModel):
    """Policy feedback response"""
    id: int
    policy_id: int
    rating: Optional[int] = None
    feedback_text: Optional[str] = None
    effectiveness_rating: Optional[int] = None
    sentiment: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class PolicyRecommendationCreate(BaseModel):
    """Create policy recommendation"""
    title: str
    description: str
    category: str
    region: str
    current_aqi: float
    recommended_actions: List[str]
    priority: str
    estimated_impact: Optional[str] = None
    implementation_cost: Optional[str] = None
    timeframe: Optional[str] = None


class PolicyRecommendationResponse(BaseModel):
    """Policy recommendation response"""
    id: int
    title: str
    description: str
    category: str
    region: str
    current_aqi: float
    recommended_actions: List[str]
    priority: str
    estimated_impact: Optional[str] = None
    confidence_score: Optional[float] = None
    is_reviewed: bool
    is_implemented: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class PolicyAnalytics(BaseModel):
    """Policy analytics dashboard data"""
    total_policies: int
    active_policies: int
    completed_policies: int
    avg_effectiveness: float
    total_investment: float
    avg_aqi_reduction: float
    top_performing_categories: List[Dict[str, Any]]
    regional_breakdown: Dict[str, Any]


class PolicyTrend(BaseModel):
    """Policy implementation trends"""
    period: str
    policies_implemented: int
    avg_reduction: float
    categories: Dict[str, int]


class PolicyCostBenefit(BaseModel):
    """Cost-benefit analysis"""
    policy_id: int
    policy_name: str
    total_cost: float
    aqi_reduction: float
    cost_per_aqi_point: float
    affected_population: int
    cost_per_capita: float
    roi_score: float