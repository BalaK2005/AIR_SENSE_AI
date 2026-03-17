import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, helpers } from '../services/api';

const PolicyLogin = ({ onLogin }) => {
  const navigate   = useNavigate();
  const [tab, setTab]         = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({ username:'', password:'', email:'', full_name:'', access_code:'' });

  const POLICY_ACCESS_CODE = 'AIRVISION2026'; // simple access gate for policy dashboard

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authAPI.login({ username: form.username, password: form.password });
      const { access_token, user } = res.data;
      // Policy dashboard only allows policy_maker or admin
      if (user.user_type === 'citizen') {
        setError('This portal is for policy makers only. Please use the citizen app at localhost:3000.');
        setLoading(false);
        return;
      }
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
    if (form.access_code !== POLICY_ACCESS_CODE) {
      setError('Invalid access code. Contact your administrator.');
      setLoading(false);
      return;
    }
    try {
      await authAPI.register({ ...form, user_type: 'policy_maker' });
      const res = await authAPI.login({ username: form.username, password: form.password });
      const { access_token, user } = res.data;
      helpers.setAuthToken(access_token);
      helpers.setUser(user);
      onLogin && onLogin(user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally { setLoading(false); }
  };

  // Demo bypass for development
  const demoLogin = () => {
    const mockUser = { id:1, username:'policymaker', full_name:'Policy Maker', user_type:'policy_maker', email:'policy@airvision.gov' };
    helpers.setUser(mockUser);
    onLogin && onLogin(mockUser);
    navigate('/');
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ position:'fixed', top:-120, right:-120, width:500, height:500, background:'rgba(102,126,234,0.07)', borderRadius:'50%', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:-100, left:-100, width:400, height:400, background:'rgba(118,75,162,0.06)', borderRadius:'50%', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:460 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:52, marginBottom:8 }}>📊</div>
          <h1 style={{ color:'white', fontSize:28, fontWeight:900, margin:0 }}>AirVision Policy</h1>
          <p style={{ color:'rgba(255,255,255,0.4)', margin:'6px 0 0 0', fontSize:14 }}>Government Policy Dashboard · Delhi-NCR</p>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:10, padding:'5px 14px', background:'rgba(102,126,234,0.2)', borderRadius:20, border:'1px solid rgba(102,126,234,0.3)' }}>
            <span style={{ width:7, height:7, background:'#667eea', borderRadius:'50%' }} />
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>Restricted Access</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)', borderRadius:24, padding:36, border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
          {/* Tabs */}
          <div style={{ display:'flex', background:'rgba(0,0,0,0.4)', borderRadius:12, padding:4, marginBottom:28 }}>
            {[['login','Sign In'],['register','Request Access']].map(([t,label]) => (
              <button key={t} onClick={() => { setTab(t); setError(''); }} style={{
                flex:1, padding:'10px', borderRadius:9, border:'none', fontWeight:700, fontSize:14,
                background: tab === t ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'transparent',
                color: 'white',
                cursor:'pointer', transition:'all 0.2s',
                opacity: tab === t ? 1 : 0.4,
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
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:6 }}>Username or Email</label>
                <input value={form.username} onChange={e => update('username', e.target.value)} required
                  placeholder="Policy maker username"
                  style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'white', fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:6 }}>Password</label>
                <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required
                  placeholder="Enter password"
                  style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'white', fontSize:14, outline:'none', boxSizing:'border-box' }} />
              </div>
              <button type="submit" disabled={loading} style={{
                padding:'14px', background:'linear-gradient(135deg,#667eea,#764ba2)',
                color:'white', border:'none', borderRadius:12, fontWeight:800, fontSize:15,
                cursor: loading ? 'not-allowed' : 'pointer', marginTop:4,
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? '⏳ Signing in...' : '🔐 Sign In to Dashboard'}
              </button>

              <div style={{ position:'relative', textAlign:'center', margin:'4px 0' }}>
                <div style={{ height:1, background:'rgba(255,255,255,0.1)' }} />
                <span style={{ position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)', background:'transparent', padding:'0 12px', fontSize:12, color:'rgba(255,255,255,0.3)' }}>or</span>
              </div>

              <button type="button" onClick={demoLogin} style={{
                padding:'12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
                color:'rgba(255,255,255,0.6)', borderRadius:12, fontWeight:600, fontSize:14, cursor:'pointer',
              }}>
                🎭 Continue as Demo Policy Maker
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ padding:'10px 14px', background:'rgba(102,126,234,0.1)', borderRadius:10, fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:4 }}>
                🔑 An access code from your administrator is required to create a policy maker account.
              </div>
              {[
                { key:'full_name',    label:'Full Name',    placeholder:'Dr. Rajesh Kumar', type:'text'     },
                { key:'email',        label:'Official Email', placeholder:'name@gov.in',    type:'email'    },
                { key:'username',     label:'Username',     placeholder:'rajesh.kumar',     type:'text'     },
                { key:'password',     label:'Password',     placeholder:'Min 8 characters', type:'password' },
                { key:'access_code',  label:'Access Code',  placeholder:'Enter access code',type:'text'     },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:6 }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => update(f.key, e.target.value)} required
                    placeholder={f.placeholder}
                    style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'white', fontSize:14, outline:'none', boxSizing:'border-box' }} />
                </div>
              ))}
              <button type="submit" disabled={loading} style={{
                padding:'14px', background:'linear-gradient(135deg,#667eea,#764ba2)',
                color:'white', border:'none', borderRadius:12, fontWeight:800, fontSize:15,
                cursor: loading ? 'not-allowed' : 'pointer', marginTop:4, opacity: loading ? 0.7 : 1,
              }}>
                {loading ? '⏳ Requesting access...' : '📋 Request Policy Access'}
              </button>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center' }}>
                Demo access code: <strong style={{ color:'rgba(255,255,255,0.5)' }}>AIRVISION2026</strong>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:12, marginTop:20 }}>
          AirVision Policy Dashboard · Government of NCR · Restricted Access
        </p>
      </div>
    </div>
  );
};

export default PolicyLogin;
