import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { aqiAPI } from '../services/api';

const NAV_LINKS = [
  { to:'/',         label:'🏠 Home',        exact:true },
  { to:'/map',      label:'🗺️ AQI Map'               },
  { to:'/forecast', label:'📈 Forecast'               },
  { to:'/alerts',   label:'🔔 Alerts'                 },
  { to:'/routes',   label:'🚗 Safe Routes'             },
];

const getAQIColor = (aqi) => {
  if (!aqi) return '#94a3b8';
  if (aqi <= 50)  return '#00c853';
  if (aqi <= 100) return '#ffd600';
  if (aqi <= 200) return '#ff6d00';
  if (aqi <= 300) return '#d50000';
  return '#6a1b9a';
};

const getAQILabel = (aqi) => {
  if (!aqi) return '…';
  if (aqi <= 50)  return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

const Navbar = ({ liveAqi: propAqi, user, onLogout }) => {
  const location                = useLocation();
  const [menuOpen, setMenu]     = useState(false);
  const [liveAqi, setLiveAqi]   = useState(propAqi || null);
  const [city, setCity]         = useState('Delhi');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!propAqi) {
      aqiAPI.getLive()
        .then(r => { setLiveAqi(r.data?.aqi); setCity(r.data?.city?.split(',')[0] || 'Delhi'); })
        .catch(() => {});
    }
  }, [propAqi]);

  useEffect(() => { if (propAqi) setLiveAqi(propAqi); }, [propAqi]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenu(false); }, [location.pathname]);

  const isActive = (to, exact) =>
    exact ? location.pathname === to : location.pathname.startsWith(to) && to !== '/';

  const aqiColor = getAQIColor(liveAqi);

  return (
    <>
      <nav style={{
        position:'sticky', top:0, zIndex:1000,
        background: scrolled ? 'rgba(30,41,90,0.97)' : 'linear-gradient(135deg,#1e295a,#2d3a8c)',
        backdropFilter:'blur(12px)',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.25)' : 'none',
        transition:'all 0.3s',
      }}>
        <div style={{ maxWidth:1300, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', height:64, gap:20 }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <span style={{ fontSize:26 }}>🌬️</span>
            <div>
              <div style={{ fontSize:17, fontWeight:900, color:'white', letterSpacing:'-0.5px', lineHeight:1 }}>AirSense AI</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>DELHI-NCR MONITOR</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div style={{ display:'flex', gap:2, flex:1, justifyContent:'center' }} className="desktop-nav">
            {NAV_LINKS.map(({ to, label, exact }) => (
              <Link key={to} to={to} style={{
                textDecoration:'none', padding:'8px 14px', borderRadius:10,
                fontSize:13, fontWeight:700, transition:'all 0.2s',
                background: isActive(to, exact) ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: isActive(to, exact) ? 'white' : 'rgba(255,255,255,0.65)',
                borderBottom: isActive(to, exact) ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
              }}>{label}</Link>
            ))}
          </div>

          {/* Live AQI pill */}
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, padding:'7px 14px', background:'rgba(255,255,255,0.1)', borderRadius:24, border:`1.5px solid ${aqiColor}60` }}>
            <div style={{ width:9, height:9, borderRadius:'50%', background:aqiColor, animation:'pulse 2s infinite' }} />
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:17, fontWeight:900, color:aqiColor, fontFamily:'monospace', lineHeight:1 }}>{liveAqi ?? '…'}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', fontWeight:600 }}>{liveAqi ? getAQILabel(liveAqi) : 'Loading'}</div>
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', borderLeft:'1px solid rgba(255,255,255,0.2)', paddingLeft:10 }}>
              📍 {city}
            </div>
          </div>

          {/* User + logout */}
          {user && (
            <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }} className="desktop-nav">
              <div style={{ width:32, height:32, background:'linear-gradient(135deg,#3b82f6,#6366f1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'white', fontSize:14 }}>
                {user.full_name?.[0] || user.username?.[0] || 'U'}
              </div>
              <button onClick={onLogout} style={{ padding:'7px 14px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'white', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                Logout
              </button>
            </div>
          )}

          {/* Hamburger */}
          <button onClick={() => setMenu(m => !m)} className="hamburger" style={{ display:'none', background:'none', border:'none', color:'white', fontSize:24, cursor:'pointer', padding:4 }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background:'rgba(30,41,90,0.98)', borderTop:'1px solid rgba(255,255,255,0.1)', padding:'16px 24px', display:'flex', flexDirection:'column', gap:4 }}>
            {NAV_LINKS.map(({ to, label, exact }) => (
              <Link key={to} to={to} style={{
                textDecoration:'none', padding:'12px 16px', borderRadius:10, fontSize:15, fontWeight:700,
                background: isActive(to, exact) ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: isActive(to, exact) ? 'white' : 'rgba(255,255,255,0.7)',
              }}>{label}</Link>
            ))}
            {user && (
              <button onClick={onLogout} style={{ margin:'8px 0 0 0', padding:'12px 16px', background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, color:'#fca5a5', fontWeight:700, cursor:'pointer', fontSize:14 }}>
                🚪 Logout
              </button>
            )}
            <div style={{ marginTop:12, padding:'12px 16px', background:'rgba(255,255,255,0.08)', borderRadius:10, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:9, height:9, borderRadius:'50%', background:aqiColor }} />
              <span style={{ color:'white', fontWeight:700 }}>AQI: </span>
              <span style={{ color:aqiColor, fontWeight:900, fontSize:20, fontFamily:'monospace' }}>{liveAqi ?? '…'}</span>
              <span style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>— {getAQILabel(liveAqi)}</span>
            </div>
          </div>
        )}
      </nav>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .hamburger   { display: block !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
