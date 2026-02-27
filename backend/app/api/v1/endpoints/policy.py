"""
Policy Endpoints
Provides policy recommendations and impact simulations
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import pickle
import numpy as np

from app.core.database import get_db
from app.schemas.policy import (
    PolicyRecommendation,
    PolicySimulation,
    PolicyImpact,
    SimulationRequest
)
from app.models.policy import Policy, PolicyLog
from app.services.cache_service import cache_get, cache_set
from app.core.security import get_current_user, require_policy_maker

router = APIRouter()

# Policy categories
POLICY_CATEGORIES = [
    "traffic_management",
    "industrial_regulation",
    "construction_control",
    "biomass_burning_ban",
    "odd_even_scheme",
    "public_transport",
    "green_zone",
    "emission_standards",
    "waste_management"
]


@router.get("/recommendations", response_model=List[PolicyRecommendation])
async def get_policy_recommendations(
    region: str = Query("Delhi", description="Region name"),
    urgency: Optional[str] = Query(None, description="Urgency level (low/medium/high/critical)"),
    current_user: dict = Depends(require_policy_maker),
    db: Session = Depends(get_db)
):
    """
    Get AI-generated policy recommendations based on current AQI conditions
    """
    try:
        cache_key = f"policy_recommendations_{region}_{urgency}"
        cached_data = cache_get(cache_key)
        if cached_data:
            return cached_data

        # Get current AQI data
        from app.models.aqi_data import AQIData
        
        recent_data = db.query(AQIData).filter(
            AQIData.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(AQIData.timestamp.desc()).limit(100).all()

        if not recent_data:
            raise HTTPException(
                status_code=404,
                detail="No recent AQI data available"
            )

        # Calculate average AQI
        avg_aqi = np.mean([d.aqi for d in recent_data])
        
        # Load recommendation model
        model = _load_policy_model()
        
        # Generate recommendations
        recommendations = _generate_recommendations(
            avg_aqi=avg_aqi,
            region=region,
            urgency=urgency,
            model=model,
            db=db
        )

        # Cache for 2 hours
        cache_set(cache_key, recommendations, ttl=7200)
        
        return recommendations

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


@router.post("/simulate", response_model=PolicySimulation)
async def simulate_policy_impact(
    simulation_request: SimulationRequest,
    current_user: dict = Depends(require_policy_maker),
    db: Session = Depends(get_db)
):
    """
    Simulate the impact of proposed policy interventions
    """
    try:
        # Validate policy types
        for policy in simulation_request.policies:
            if policy not in POLICY_CATEGORIES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid policy type: {policy}"
                )

        # Get baseline data
        from app.models.aqi_data import AQIData
        
        baseline_data = db.query(AQIData).filter(
            AQIData.timestamp >= datetime.utcnow() - timedelta(days=30)
        ).all()

        if not baseline_data:
            raise HTTPException(
                status_code=404,
                detail="Insufficient baseline data for simulation"
            )

        # Calculate baseline AQI
        baseline_aqi = np.mean([d.aqi for d in baseline_data])
        
        # Load simulation model
        model = _load_policy_model()
        
        # Run simulation
        simulation_results = _run_policy_simulation(
            policies=simulation_request.policies,
            duration_days=simulation_request.duration_days,
            baseline_aqi=baseline_aqi,
            region=simulation_request.region,
            model=model
        )

        return simulation_results

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running simulation: {str(e)}")


@router.get("/history", response_model=List[PolicyImpact])
async def get_policy_history(
    region: Optional[str] = Query(None, description="Filter by region"),
    start_date: Optional[datetime] = Query(None, description="Start date"),
    end_date: Optional[datetime] = Query(None, description="End date"),
    current_user: dict = Depends(require_policy_maker),
    db: Session = Depends(get_db)
):
    """
    Get historical policy implementations and their impacts
    """
    try:
        query = db.query(PolicyLog)

        if region:
            query = query.filter(PolicyLog.region == region)
        
        if start_date:
            query = query.filter(PolicyLog.implemented_date >= start_date)
        
        if end_date:
            query = query.filter(PolicyLog.implemented_date <= end_date)

        policies = query.order_by(PolicyLog.implemented_date.desc()).limit(50).all()

        return [
            PolicyImpact(
                policy_id=p.id,
                policy_name=p.policy_name,
                category=p.category,
                region=p.region,
                implemented_date=p.implemented_date,
                aqi_before=p.aqi_before,
                aqi_after=p.aqi_after,
                reduction_percentage=((p.aqi_before - p.aqi_after) / p.aqi_before) * 100,
                status=p.status,
                notes=p.notes
            )
            for p in policies
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching policy history: {str(e)}")


@router.post("/implement")
async def log_policy_implementation(
    policy_data: Dict = Body(...),
    current_user: dict = Depends(require_policy_maker),
    db: Session = Depends(get_db)
):
    """
    Log a new policy implementation
    """
    try:
        # Get current AQI as baseline
        from app.models.aqi_data import AQIData
        
        recent_aqi = db.query(AQIData).filter(
            AQIData.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(AQIData.timestamp.desc()).first()

        policy_log = PolicyLog(
            policy_name=policy_data["policy_name"],
            category=policy_data["category"],
            region=policy_data["region"],
            implemented_date=datetime.utcnow(),
            aqi_before=recent_aqi.aqi if recent_aqi else None,
            status="active",
            notes=policy_data.get("notes", ""),
            implemented_by=current_user["user_id"]
        )

        db.add(policy_log)
        db.commit()
        db.refresh(policy_log)

        return {
            "message": "Policy implementation logged successfully",
            "policy_id": policy_log.id,
            "baseline_aqi": policy_log.aqi_before
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error logging policy: {str(e)}")


@router.put("/update/{policy_id}")
async def update_policy_impact(
    policy_id: int,
    impact_data: Dict = Body(...),
    current_user: dict = Depends(require_policy_maker),
    db: Session = Depends(get_db)
):
    """
    Update policy with measured impact
    """
    try:
        policy = db.query(PolicyLog).filter(PolicyLog.id == policy_id).first()
        
        if not policy:
            raise HTTPException(status_code=404, detail="Policy not found")

        policy.aqi_after = impact_data.get("aqi_after")
        policy.status = impact_data.get("status", policy.status)
        policy.notes = impact_data.get("notes", policy.notes)
        policy.updated_at = datetime.utcnow()

        db.commit()

        return {
            "message": "Policy impact updated successfully",
            "reduction_percentage": ((policy.aqi_before - policy.aqi_after) / policy.aqi_before) * 100
            if policy.aqi_after else None
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating policy: {str(e)}")


@router.get("/effectiveness")
async def analyze_policy_effectiveness(
    category: Optional[str] = Query(None, description="Policy category"),
    region: Optional[str] = Query(None, description="Region"),
    current_user: dict = Depends(require_policy_maker),
    db: Session = Depends(get_db)
):
    """
    Analyze effectiveness of policies by category or region
    """
    try:
        query = db.query(PolicyLog).filter(
            PolicyLog.aqi_before.isnot(None),
            PolicyLog.aqi_after.isnot(None)
        )

        if category:
            query = query.filter(PolicyLog.category == category)
        
        if region:
            query = query.filter(PolicyLog.region == region)

        policies = query.all()

        if not policies:
            raise HTTPException(
                status_code=404,
                detail="No completed policies found for analysis"
            )

        # Calculate statistics
        reductions = [
            ((p.aqi_before - p.aqi_after) / p.aqi_before) * 100
            for p in policies
        ]

        effectiveness = {
            "total_policies": len(policies),
            "avg_reduction_percentage": np.mean(reductions),
            "median_reduction_percentage": np.median(reductions),
            "min_reduction_percentage": min(reductions),
            "max_reduction_percentage": max(reductions),
            "successful_policies": sum(1 for r in reductions if r > 0),
            "category": category or "all",
            "region": region or "all"
        }

        return effectiveness

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing effectiveness: {str(e)}")


@router.get("/compare")
async def compare_policy_scenarios(
    scenario_a: List[str] = Query(..., description="First policy scenario"),
    scenario_b: List[str] = Query(..., description="Second policy scenario"),
    region: str = Query("Delhi", description="Region"),
    current_user: dict = Depends(require_policy_maker),
    db: Session = Depends(get_db)
):
    """
    Compare impact of two different policy scenarios
    """
    try:
        # Simulate both scenarios
        sim_a = await simulate_policy_impact(
            SimulationRequest(
                policies=scenario_a,
                region=region,
                duration_days=30
            ),
            current_user=current_user,
            db=db
        )

        sim_b = await simulate_policy_impact(
            SimulationRequest(
                policies=scenario_b,
                region=region,
                duration_days=30
            ),
            current_user=current_user,
            db=db
        )

        comparison = {
            "scenario_a": {
                "policies": scenario_a,
                "predicted_reduction": sim_a.predicted_reduction_percentage,
                "final_aqi": sim_a.projected_aqi[-1] if sim_a.projected_aqi else None
            },
            "scenario_b": {
                "policies": scenario_b,
                "predicted_reduction": sim_b.predicted_reduction_percentage,
                "final_aqi": sim_b.projected_aqi[-1] if sim_b.projected_aqi else None
            },
            "recommendation": "scenario_a" if sim_a.predicted_reduction_percentage > sim_b.predicted_reduction_percentage else "scenario_b",
            "difference_percentage": abs(sim_a.predicted_reduction_percentage - sim_b.predicted_reduction_percentage)
        }

        return comparison

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing scenarios: {str(e)}")


# Helper functions
def _load_policy_model():
    """Load the policy recommendation ML model"""
    try:
        with open('ml-models/trained_models/policy_recommender.pkl', 'rb') as f:
            return pickle.load(f)
    except:
        return None


def _generate_recommendations(avg_aqi, region, urgency, model, db):
    """Generate policy recommendations based on current conditions"""
    recommendations = []
    
    # Determine urgency if not provided
    if not urgency:
        if avg_aqi > 400:
            urgency = "critical"
        elif avg_aqi > 300:
            urgency = "high"
        elif avg_aqi > 200:
            urgency = "medium"
        else:
            urgency = "low"

    # Get source attribution for targeted recommendations
    from app.api.v1.endpoints.source import get_source_breakdown
    
    try:
        sources = get_source_breakdown(region=region, db=db)
        dominant_sources = sorted(
            sources.sources,
            key=lambda x: x["percentage"],
            reverse=True
        )[:3]
    except:
        dominant_sources = []

    # Generate recommendations based on conditions
    if avg_aqi > 400:
        recommendations.extend([
            PolicyRecommendation(
                title="Emergency Measures - Complete Lockdown",
                description="Implement complete lockdown on construction and industrial activities",
                category="emergency",
                priority="critical",
                estimated_impact="30-40% reduction",
                implementation_cost="high",
                timeframe="immediate",
                affected_sectors=["construction", "industrial", "transport"]
            ),
            PolicyRecommendation(
                title="Odd-Even Traffic Scheme",
                description="Implement strict odd-even vehicle scheme across NCR",
                category="traffic_management",
                priority="critical",
                estimated_impact="15-20% reduction",
                implementation_cost="medium",
                timeframe="1-2 days",
                affected_sectors=["transport", "commercial"]
            )
        ])
    
    if avg_aqi > 300:
        recommendations.extend([
            PolicyRecommendation(
                title="Construction Ban",
                description="Ban all construction and demolition activities",
                category="construction_control",
                priority="high",
                estimated_impact="10-15% reduction",
                implementation_cost="medium",
                timeframe="immediate",
                affected_sectors=["construction"]
            ),
            PolicyRecommendation(
                title="Industrial Emission Control",
                description="Mandate 50% reduction in industrial operations",
                category="industrial_regulation",
                priority="high",
                estimated_impact="15-20% reduction",
                implementation_cost="high",
                timeframe="1-3 days",
                affected_sectors=["industrial"]
            )
        ])

    if avg_aqi > 200:
        recommendations.extend([
            PolicyRecommendation(
                title="Enhanced Public Transport",
                description="Increase public transport frequency and reduce fares",
                category="public_transport",
                priority="medium",
                estimated_impact="5-10% reduction",
                implementation_cost="medium",
                timeframe="1 week",
                affected_sectors=["transport"]
            ),
            PolicyRecommendation(
                title="Dust Control Measures",
                description="Increase road cleaning and water sprinkling frequency",
                category="dust_control",
                priority="medium",
                estimated_impact="5-8% reduction",
                implementation_cost="low",
                timeframe="immediate",
                affected_sectors=["municipal"]
            )
        ])

    # Add long-term recommendations
    recommendations.append(
        PolicyRecommendation(
            title="Green Zone Expansion",
            description="Expand green cover and establish more urban forests",
            category="green_zone",
            priority="low",
            estimated_impact="5-10% reduction (long-term)",
            implementation_cost="high",
            timeframe="6-12 months",
            affected_sectors=["urban_planning"]
        )
    )

    return recommendations[:5]  # Return top 5 recommendations


def _run_policy_simulation(policies, duration_days, baseline_aqi, region, model):
    """Simulate policy impact over time"""
    
    # Policy impact factors (simplified)
    impact_factors = {
        "traffic_management": 0.15,
        "industrial_regulation": 0.20,
        "construction_control": 0.12,
        "biomass_burning_ban": 0.10,
        "odd_even_scheme": 0.18,
        "public_transport": 0.08,
        "green_zone": 0.05,
        "emission_standards": 0.15,
        "waste_management": 0.07
    }

    # Calculate total impact
    total_impact = sum(impact_factors.get(p, 0.05) for p in policies)
    total_impact = min(total_impact, 0.50)  # Cap at 50% max reduction

    # Generate projected AQI over time
    projected_aqi = []
    current_aqi = baseline_aqi
    
    for day in range(duration_days):
        # Gradual reduction
        reduction_factor = 1 - (total_impact * (day / duration_days))
        daily_aqi = baseline_aqi * reduction_factor
        
        # Add some randomness
        daily_aqi += np.random.uniform(-10, 10)
        daily_aqi = max(50, daily_aqi)  # Minimum AQI
        
        projected_aqi.append(round(daily_aqi, 2))
        current_aqi = daily_aqi

    final_aqi = projected_aqi[-1]
    reduction_percentage = ((baseline_aqi - final_aqi) / baseline_aqi) * 100

    return PolicySimulation(
        policies=policies,
        region=region,
        baseline_aqi=baseline_aqi,
        projected_aqi=projected_aqi,
        predicted_reduction_percentage=round(reduction_percentage, 2),
        duration_days=duration_days,
        confidence_score=0.75,
        assumptions=[
            "Weather conditions remain stable",
            "100% policy compliance",
            "No external pollution events",
            f"Simulation based on {duration_days} days projection"
        ]
    )