# AirVision - Policy Dashboard

Air quality management and policy impact analysis platform for policymakers in Delhi-NCR.

## Features

- 🗺️ **Regional Map**: Full Delhi-NCR visualization with regional boundaries
- 🔬 **Source Attribution**: Pollution source analysis with ML models
- 📈 **Policy Analytics**: Track effectiveness of implemented policies
- 💡 **AI Recommendations**: Data-driven policy suggestions
- 🎯 **Impact Simulation**: Model projected outcomes of policy combinations
- 📊 **Comprehensive Analytics**: Historical trends and comparisons

## Tech Stack

- **React 18** - UI framework
- **React Router** - Navigation
- **Leaflet** - Regional mapping
- **Recharts** - Charts and analytics
- **Axios** - API communication
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend API running on http://localhost:8000
- Policy maker account credentials

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
# REACT_APP_API_URL=http://localhost:8000/api/v1

# Start development server
npm start
```

The dashboard will be available at http://localhost:3000

### Build for Production

```bash
npm run build
```

The optimized build will be in the `build/` directory.

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── RegionalMap.jsx
│   ├── SourceAttribution.jsx
│   ├── PolicyAnalytics.jsx
│   ├── Recommendations.jsx
│   └── Sidebar.jsx
├── pages/              # Page components
│   ├── Overview.jsx
│   ├── SourceAnalysis.jsx
│   ├── PolicyImpact.jsx
│   └── Simulation.jsx
├── services/           # API services
│   └── api.js
├── App.jsx             # Main app
└── index.js            # Entry point
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `REACT_APP_API_URL` - Backend API endpoint
- `REACT_APP_ENABLE_SIMULATION` - Enable/disable policy simulation
- `REACT_APP_ENABLE_AI_RECOMMENDATIONS` - Enable/disable AI features

## API Integration

**Main endpoints:**
- `/aqi/current` - Real-time AQI data
- `/source/breakdown` - Pollution source attribution
- `/policy/recommendations` - AI-generated policy suggestions
- `/policy/simulate` - Policy impact simulation
- `/policy/history` - Historical policy data
- `/policy/effectiveness` - Policy effectiveness metrics

## Features Guide

### Overview Page
- Regional air quality monitoring
- Key metrics and statistics
- Quick actions and alerts

### Source Analysis
- Pollution source breakdown by category
- Temporal trends
- Regional comparisons

### Policy Impact
- Historical policy effectiveness
- Success rate analytics
- AI-powered recommendations

### Simulation
- Multi-policy impact modeling
- Projected AQI trends
- Confidence scoring

## User Roles

This dashboard requires policy maker or admin privileges. Contact system administrator for access.

## Security

- JWT-based authentication
- Role-based access control
- Secure API communication
- Session management

## Performance

- Lazy loading for optimal performance
- Chart data virtualization
- Caching strategies
- Optimized bundle size

## Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Submit pull request

## License

This is a government policy tool. Unauthorized access is prohibited.

## Support

For technical support or feature requests, contact the development team.