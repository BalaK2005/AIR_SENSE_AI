# AirVision - Citizen App

Real-time hyperlocal air quality monitoring application for citizens of Delhi-NCR.

## Features

- 🗺️ **Interactive AQI Map**: Hyperlocal air quality visualization with 100+ monitoring stations
- 📊 **Real-time Dashboard**: Live AQI data with pollutant breakdowns
- 🔮 **72-Hour Forecast**: AI-powered LSTM predictions
- 🛣️ **Safe Routes**: AQI-optimized route recommendations
- 🔔 **Health Alerts**: Personalized notifications based on air quality
- 📱 **Mobile Responsive**: Optimized for all devices

## Tech Stack

- **React 18** - UI framework
- **React Router** - Navigation
- **Leaflet** - Interactive maps
- **Recharts** - Data visualization
- **Axios** - API communication
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend API running on http://localhost:8000

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

The app will be available at http://localhost:3000

### Build for Production

```bash
npm run build
```

The optimized build will be in the `build/` directory.

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── AQIMap.jsx
│   ├── HealthAlerts.jsx
│   ├── SafeRoute.jsx
│   ├── AQIForecast.jsx
│   └── Navbar.jsx
├── pages/           # Page components
│   ├── Home.jsx
│   ├── Dashboard.jsx
│   └── RouteMap.jsx
├── services/        # API services
│   └── api.js
├── App.jsx          # Main app component
└── index.js         # Entry point
```

## Environment Variables

See `.env.example` for all available configuration options.

## API Integration

The app connects to the AirVision backend API. Ensure the backend is running and accessible.

**Endpoints used:**
- `/aqi/current` - Current AQI data
- `/aqi/historical` - Historical data
- `/forecast/hourly` - Hourly forecasts
- `/route/safe-route` - Safe route calculation
- `/alerts/me` - User alerts

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is part of the AirVision air quality monitoring platform.

## Support

For issues and questions, please contact the development team.