import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, helpers } from '../services/api';

const CitizenLogin = ({ onLogin }) => {
  const navigate   = useNavigate();
  const [tab, setTab]         = useState('login'); // login | register
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({ username:'', password:'', email:'', full_name:'' });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authAPI.login({ username: form.username, password: form.password });
      const { access_token, user } = res.data;
      helpers.setAuthToken(access_token);
      helpers.setUser(user);
      onLogin && onLogin(user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authAPI.register({ ...form, user_type: 'citizen' });
      // Auto-login after register
      const res = await authAPI.login({ username: form.username, password: form.password });
      const { access_token, user } = res.data;
      helpers.setAuthToken(access_token);
      helpers.setUser(user);
      onLogin && onLogin(user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      {/* Background circles */}
      <div style={{ position:'fixed', top:-100, right:-100, width:400, height:400, background:'rgba(59,130,246,0.08)', borderRadius:'50%', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:-80, left:-80, width:300, height:300, background:'rgba(16,185,129,0.06)', borderRadius:'50%', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:440 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>🌬️</div>
          <h1 style={{ color:'white', fontSize:28, fontWeight:900, margin:0 }}>AirSense AI</h1>
          <p style={{ color:'rgba(255,255,255,0.5)', margin:'6px 0 0 0', fontSize:14 }}>Real-time Air Quality Monitoring · Delhi-NCR</p>
        </div>

        {/* Card */}
        <div style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(20px)', borderRadius:24, padding:36, border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }}>
          {/* Tabs */}
          <div style={{ display:'flex', background:'rgba(0,0,0,0.3)', borderRadius:12, padding:4, marginBottom:28 }}>
            {[['login','Sign In'],['register','Create Account']].map(([t,label]) => (
              <button key={t} onClick={() => { setTab(t); setError(''); }} style={{
                flex:1, padding:'10px', borderRadius:9, border:'none', fontWeight:700, fontSize:14,
                background: tab === t ? 'white' : 'transparent',
                color: tab === t ? '#1e293b' : 'rgba(255,255,255,0.5)',
                cursor:'pointer', transition:'all 0.2s',
              }}>{label}</button>
            ))}
          </div>

          {error && (
            <div style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'10px 14px', marginBottom:20, fontSize:13, color:'#fca5a5' }}>
              ⚠️ {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>Username or Email</label>
                <input value={form.username} onChange={e => update('username', e.target.value)} required
                  placeholder="Enter your username"
                  style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, color:'white', fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>Password</label>
                <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required
                  placeholder="Enter your password"
                  style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, color:'white', fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
              <button type="submit" disabled={loading} style={{
                padding:'14px', background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                color:'white', border:'none', borderRadius:12, fontWeight:800, fontSize:15,
                cursor: loading ? 'not-allowed' : 'pointer', marginTop:4,
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? '⏳ Signing in...' : '🚀 Sign In'}
              </button>

              {/* Demo credentials hint */}
              <div style={{ padding:'10px 14px', background:'rgba(59,130,246,0.1)', borderRadius:10, fontSize:12, color:'rgba(255,255,255,0.5)', textAlign:'center' }}>
                No account? Create one using the "Create Account" tab above.
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>Full Name</label>
                <input value={form.full_name} onChange={e => update('full_name', e.target.value)} required
                  placeholder="Your full name"
                  style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, color:'white', fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>Email</label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required
                  placeholder="your@email.com"
                  style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, color:'white', fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>Username</label>
                <input value={form.username} onChange={e => update('username', e.target.value)} required
                  placeholder="Choose a username"
                  style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, color:'white', fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6 }}>Password</label>
                <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required minLength={8}
                  placeholder="Min 8 characters"
                  style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, color:'white', fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
              <button type="submit" disabled={loading} style={{
                padding:'14px', background:'linear-gradient(135deg,#10b981,#059669)',
                color:'white', border:'none', borderRadius:12, fontWeight:800, fontSize:15,
                cursor: loading ? 'not-allowed' : 'pointer', marginTop:4,
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? '⏳ Creating account...' : '✅ Create Account'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:12, marginTop:20 }}>
          AirSense AI · Delhi-NCR Air Quality Platform
        </p>
      </div>
    </div>
  );
};

export default CitizenLogin;
