'use client';
import { useState, useEffect, useCallback } from 'react';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getWeatherIcon = (code) => {
  if (!code && code !== 0) return '🌡️';
  if (code <= 1) return '☀️'; if (code <= 3) return '⛅'; if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️'; if (code <= 77) return '❄️';
  if (code <= 82) return '🌧️'; if (code <= 86) return '❄️'; return '⛈️';
};

const getWeatherDescription = (code) => {
  if (!code && code !== 0) return 'Unknown';
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 55) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  return 'Thunderstorm';
};

export default function DashboardPage() {
  const [weather, setWeather] = useState(null);
  const [marketPrices, setMarketPrices] = useState([]);
  const [postCount, setPostCount] = useState('—');
  const [scanCount, setScanCount] = useState(0);
  const [priceSource, setPriceSource] = useState('cached');
  const [loading, setLoading] = useState({ weather: true, market: true, community: true, health: true });
  const [weatherLocation, setWeatherLocation] = useState('Delhi');
  const [weatherCoords, setWeatherCoords] = useState({ lat: 28.6, lon: 77.2 });
  const [locationInput, setLocationInput] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [marketSort, setMarketSort] = useState('name');
  const [marketSearch, setMarketSearch] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const [backendHealth, setBackendHealth] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [refreshing, setRefreshing] = useState({ weather: false, market: false });
  const [activeTab, setActiveTab] = useState('overview');

  // Real-time clock
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load scan count and history from localStorage
  useEffect(() => {
    const stored = parseInt(localStorage.getItem('scan_count') || '0', 10);
    setScanCount(stored);
    try {
      const history = JSON.parse(localStorage.getItem('scan_history') || '[]');
      setRecentScans(history.slice(0, 5));
    } catch { setRecentScans([]); }
  }, []);

  // Backend health check
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => {
        setBackendHealth({ ...data, status: 'online' });
        setLoading(l => ({ ...l, health: false }));
      })
      .catch(() => {
        setBackendHealth({ status: 'offline' });
        setLoading(l => ({ ...l, health: false }));
      });
  }, []);

  // Fetch live weather
  const fetchWeather = useCallback((lat, lon) => {
    setLoading(l => ({ ...l, weather: true }));
    setRefreshing(r => ({ ...r, weather: true }));
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&current_weather=true&timezone=auto&hourly=relativehumidity_2m`)
      .then(r => r.json())
      .then(data => {
        setWeather(data);
        setLoading(l => ({ ...l, weather: false }));
        setRefreshing(r => ({ ...r, weather: false }));
      })
      .catch(() => {
        setLoading(l => ({ ...l, weather: false }));
        setRefreshing(r => ({ ...r, weather: false }));
      });
  }, []);

  useEffect(() => { fetchWeather(weatherCoords.lat, weatherCoords.lon); }, [weatherCoords, fetchWeather]);

  // Fetch live market prices
  const fetchMarket = useCallback(() => {
    setLoading(l => ({ ...l, market: true }));
    setRefreshing(r => ({ ...r, market: true }));
    fetch('/api/market/prices')
      .then(r => r.json())
      .then(data => {
        setMarketPrices(data.prices || []);
        setPriceSource(data.source || 'cached');
        setLoading(l => ({ ...l, market: false }));
        setRefreshing(r => ({ ...r, market: false }));
      })
      .catch(() => {
        setMarketPrices([
          { crop: 'Rice', price: 2450, change: 3.2, unit: '₹/quintal' },
          { crop: 'Wheat', price: 2275, change: -1.5, unit: '₹/quintal' },
          { crop: 'Tomato', price: 1850, change: 5.8, unit: '₹/quintal' },
          { crop: 'Potato', price: 1200, change: -2.1, unit: '₹/quintal' },
          { crop: 'Onion', price: 1680, change: 4.3, unit: '₹/quintal' },
        ]);
        setLoading(l => ({ ...l, market: false }));
        setRefreshing(r => ({ ...r, market: false }));
      });
  }, []);

  useEffect(() => { fetchMarket(); }, [fetchMarket]);

  // Fetch community post count
  useEffect(() => {
    fetch('/api/community/posts')
      .then(r => r.json())
      .then(data => {
        setPostCount(data.posts?.length ?? '—');
        setLoading(l => ({ ...l, community: false }));
      })
      .catch(() => setLoading(l => ({ ...l, community: false })));
  }, []);

  // Change weather location
  const changeLocation = async (name, lat, lon) => {
    setWeatherLocation(name);
    setWeatherCoords({ lat, lon });
    setShowLocationPicker(false);
    setLocationInput('');
  };

  const searchLocation = async () => {
    if (!locationInput.trim()) return;
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationInput)}&count=1`);
      const data = await res.json();
      if (data.results?.length) {
        const loc = data.results[0];
        changeLocation(loc.name, loc.latitude, loc.longitude);
      }
    } catch {}
  };

  const cur = weather?.current_weather;
  const daily = weather?.daily;
  const humidity = weather?.hourly?.relativehumidity_2m?.[new Date().getHours()] || '—';

  // Sort and filter market prices
  const sortedPrices = [...marketPrices]
    .filter(m => !marketSearch || m.crop.toLowerCase().includes(marketSearch.toLowerCase()))
    .sort((a, b) => {
      if (marketSort === 'name') return a.crop.localeCompare(b.crop);
      if (marketSort === 'price-high') return b.price - a.price;
      if (marketSort === 'price-low') return a.price - b.price;
      if (marketSort === 'change') return b.change - a.change;
      return 0;
    });

  const presetLocations = [
    { name: 'Delhi', lat: 28.6, lon: 77.2 },
    { name: 'Mumbai', lat: 19.07, lon: 72.87 },
    { name: 'Bangalore', lat: 12.97, lon: 77.59 },
    { name: 'Hyderabad', lat: 17.38, lon: 78.49 },
    { name: 'Chennai', lat: 13.08, lon: 80.27 },
    { name: 'Kolkata', lat: 22.57, lon: 88.36 },
  ];

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header with time */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1>📊 Dashboard</h1>
            <p>Welcome back! Here&apos;s your farming overview with real-time insights.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-400)' }}>
              {mounted ? currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—:—'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {mounted ? currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) : 'Loading date...'}
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <span className={`badge ${backendHealth?.status === 'online' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                {backendHealth?.status === 'online' ? '● Backend Online' : '● Backend Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="tabs" style={{ marginBottom: 24 }}>
          {[
            { id: 'overview', label: '📊 Overview', icon: '' },
            { id: 'weather', label: '🌤️ Weather', icon: '' },
            { id: 'market', label: '📈 Market', icon: '' },
            { id: 'tools', label: '🛠️ Tools', icon: '' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Stats — always visible, clickable */}
        <div className="grid-4 dashboard-stats">
          {[
            { icon: '🔬', label: 'Disease Scans', value: scanCount, color: 'var(--primary-400)', href: '/disease-detect' },
            { icon: '📈', label: 'Market Crops', value: marketPrices.length, color: 'var(--accent-400)', href: '/market' },
            { icon: '💬', label: 'Forum Posts', value: postCount, color: 'var(--earth-300)', href: '/community' },
            { icon: '🌤️', label: 'Temperature', value: cur ? `${cur.temperature}°C` : '—', color: 'var(--sky-400)', href: '/weather' },
          ].map((stat) => (
            <a key={stat.label} href={stat.href} className="glass-card stat-mini" style={{ textDecoration: 'none', cursor: 'pointer', transition: 'all 0.3s ease' }}>
              <div className="stat-mini-icon">{stat.icon}</div>
              <div>
                <div className="stat-mini-value" style={{ color: stat.color }}>{stat.value}</div>
                <div className="stat-mini-label">{stat.label}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '1.2rem', color: 'var(--text-muted)', opacity: 0.5 }}>→</div>
            </a>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="dashboard-grid">
            {/* Live Weather Widget */}
            <div className="glass-card weather-widget" id="weather-widget">
              <div className="widget-header">
                <h3>🌤️ Live Weather — {weatherLocation}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowLocationPicker(!showLocationPicker)} title="Change location">📍</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => fetchWeather(weatherCoords.lat, weatherCoords.lon)} disabled={refreshing.weather} title="Refresh">
                    {refreshing.weather ? '⟳' : '🔄'}
                  </button>
                  <a href="/weather" className="btn btn-sm btn-secondary">View Full →</a>
                </div>
              </div>

              {/* Location picker */}
              {showLocationPicker && (
                <div style={{ marginBottom: 16, padding: 16, background: 'rgba(10,15,13,0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                      className="form-input"
                      placeholder="Search any city..."
                      value={locationInput}
                      onChange={e => setLocationInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchLocation()}
                      style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={searchLocation}>🔍</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {presetLocations.map(loc => (
                      <button key={loc.name} className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                        onClick={() => changeLocation(loc.name, loc.lat, loc.lon)}>
                        {loc.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading.weather && <div className="loading-overlay" style={{ minHeight: 150 }}><div className="spinner"></div></div>}
              {!loading.weather && cur && daily && (
                <>
                  <div className="weather-main">
                    <div style={{ fontSize: '3rem' }}>{getWeatherIcon(cur.weathercode)}</div>
                    <div>
                      <div className="weather-temp">{cur.temperature}°C</div>
                      <div className="weather-details">
                        <span>{getWeatherDescription(cur.weathercode)}</span>
                        <span>💨 {cur.windspeed} km/h • 💧 {humidity}% humidity</span>
                        <span>↑ {daily.temperature_2m_max[0]}° / ↓ {daily.temperature_2m_min[0]}°</span>
                      </div>
                    </div>
                  </div>
                  <div className="weather-forecast">
                    {daily.time.slice(0, 5).map((date, i) => {
                      const d = new Date(date);
                      return (
                        <div key={date} className="forecast-day" style={{ cursor: 'pointer' }}
                          onClick={() => window.location.href = '/weather'}>
                          <span className="forecast-label">{i === 0 ? 'Today' : dayNames[d.getDay()]}</span>
                          <span className="forecast-icon">{getWeatherIcon(daily.weathercode[i])}</span>
                          <span className="forecast-temp">{Math.round(daily.temperature_2m_max[i])}°</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--sky-400)' }}>💧{daily.precipitation_sum[i]}mm</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {!loading.weather && !cur && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{ color: 'var(--text-muted)' }}>Weather data unavailable</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => fetchWeather(weatherCoords.lat, weatherCoords.lon)}>Retry</button>
                </div>
              )}
            </div>

            {/* Market Trends */}
            <div className="glass-card market-widget" id="market-widget">
              <div className="widget-header">
                <h3>📊 Market Prices {priceSource === 'live' ? <span className="badge badge-success" style={{ fontSize: '0.7rem', marginLeft: 8 }}>● LIVE</span> : ''}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-secondary" onClick={fetchMarket} disabled={refreshing.market} title="Refresh">
                    {refreshing.market ? '⟳' : '🔄'}
                  </button>
                  <a href="/market" className="btn btn-sm btn-secondary">See All →</a>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input className="form-input" placeholder="Search crops..." value={marketSearch} onChange={e => setMarketSearch(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', fontSize: '0.82rem' }} />
                <select className="form-select" value={marketSort} onChange={e => setMarketSort(e.target.value)} style={{ padding: '6px 10px', fontSize: '0.82rem', width: 'auto' }}>
                  <option value="name">A-Z</option>
                  <option value="price-high">Price ↓</option>
                  <option value="price-low">Price ↑</option>
                  <option value="change">Change ↓</option>
                </select>
              </div>
              {loading.market && <div className="loading-overlay" style={{ minHeight: 150 }}><div className="spinner"></div></div>}
              <div className="market-list">
                {sortedPrices.map((m) => (
                  <a key={m.crop} href="/market" className="market-item" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                    <div className="market-crop">{m.crop}</div>
                    <div className="market-price">₹{Number(m.price).toLocaleString()}</div>
                    <div className={`market-change ${m.change >= 0 ? 'positive' : 'negative'}`}>
                      {m.change >= 0 ? '▲' : '▼'} {Math.abs(m.change)}%
                    </div>
                  </a>
                ))}
                {sortedPrices.length === 0 && !loading.market && (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No crops match your search</div>
                )}
              </div>
            </div>

            {/* Disease Detection Widget */}
            <div className="glass-card diagnoses-widget" id="diagnoses-widget">
              <div className="widget-header">
                <h3>🔬 Disease Detection</h3>
                <a href="/disease-detect" className="btn btn-sm btn-primary">Scan Now →</a>
              </div>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🌿</div>
                <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>CNN MobileNetV2 + Gemini Fallback</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                  Upload crop photos for instant AI disease diagnosis with treatment recommendations.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div style={{ padding: '12px 8px', background: 'rgba(34,197,94,0.06)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-400)' }}>{scanCount}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Scans Done</div>
                  </div>
                  <div style={{ padding: '12px 8px', background: 'rgba(245,158,11,0.06)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-400)' }}>15</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Disease Classes</div>
                  </div>
                  <div style={{ padding: '12px 8px', background: 'rgba(14,165,233,0.06)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--sky-400)' }}>3</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Crop Types</div>
                  </div>
                </div>
                {recentScans.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 12 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8, textAlign: 'left' }}>Recent Scans</div>
                    {recentScans.map((scan, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.82rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span>{scan.disease || 'Unknown'}</span>
                        <span style={{ color: 'var(--primary-400)' }}>{scan.confidence || '—'}%</span>
                      </div>
                    ))}
                  </div>
                )}
                <a href="/disease-detect" className="btn btn-primary" style={{ marginTop: 16, width: '100%' }}>📸 Start New Scan</a>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card actions-widget" id="actions-widget">
              <div className="widget-header">
                <h3>⚡ Quick Actions</h3>
              </div>
              <div className="actions-grid">
                {[
                  { icon: '📸', label: 'Scan Crop', desc: 'AI Disease Detection', href: '/disease-detect', color: '#22c55e' },
                  { icon: '📈', label: 'Price Forecast', desc: 'LSTM Prediction', href: '/market', color: '#f59e0b' },
                  { icon: '🌤️', label: 'Weather', desc: 'Live Forecast', href: '/weather', color: '#06b6d4' },
                  { icon: '💬', label: 'Community', desc: 'Forum & Chat', href: '/community', color: '#ec4899' },
                  { icon: '💧', label: 'Irrigation', desc: 'Smart Schedule', href: '/irrigation', color: '#3b82f6' },
                  { icon: '🧠', label: 'AI Decision', desc: 'All-in-One AI', href: '/ai-decision', color: '#8b5cf6' },
                ].map((action) => (
                  <a key={action.label} href={action.href} className="action-btn" style={{ '--action-color': action.color }}>
                    <span className="action-icon">{action.icon}</span>
                    <span className="action-label">{action.label}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{action.desc}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WEATHER TAB — detailed */}
        {activeTab === 'weather' && (
          <div>
            <div className="glass-card" style={{ marginBottom: 24 }}>
              <div className="widget-header">
                <h3>🌤️ Detailed Weather — {weatherLocation}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowLocationPicker(!showLocationPicker)}>📍 Change Location</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => fetchWeather(weatherCoords.lat, weatherCoords.lon)}>🔄 Refresh</button>
                </div>
              </div>
              {showLocationPicker && (
                <div style={{ marginBottom: 16, padding: 16, background: 'rgba(10,15,13,0.6)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input className="form-input" placeholder="Search any city..." value={locationInput} onChange={e => setLocationInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchLocation()} style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }} />
                    <button className="btn btn-primary btn-sm" onClick={searchLocation}>🔍 Search</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {presetLocations.map(loc => (
                      <button key={loc.name} className={`btn btn-sm ${weatherLocation === loc.name ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.78rem' }}
                        onClick={() => changeLocation(loc.name, loc.lat, loc.lon)}>{loc.name}</button>
                    ))}
                  </div>
                </div>
              )}
              {cur && daily && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                    <div style={{ textAlign: 'center', padding: 20, background: 'rgba(34,197,94,0.06)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '2.5rem' }}>{getWeatherIcon(cur.weathercode)}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--primary-400)' }}>{cur.temperature}°C</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{getWeatherDescription(cur.weathercode)}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20, background: 'rgba(6,182,212,0.06)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 4 }}>💨</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--sky-400)' }}>{cur.windspeed} km/h</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Wind Speed</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20, background: 'rgba(59,130,246,0.06)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 4 }}>💧</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>{humidity}%</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Humidity</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20, background: 'rgba(245,158,11,0.06)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 4 }}>🌧️</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-400)' }}>{daily.precipitation_sum[0]}mm</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Today&apos;s Rain</div>
                    </div>
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>📅 7-Day Forecast</h4>
                  <div className="weather-forecast" style={{ gap: 10 }}>
                    {daily.time.map((date, i) => {
                      const d = new Date(date);
                      return (
                        <div key={date} className="forecast-day" style={{ padding: '14px 10px', cursor: 'pointer', flex: 1 }}
                          onClick={() => window.location.href = '/weather'}>
                          <span className="forecast-label">{i === 0 ? 'Today' : dayNames[d.getDay()]}</span>
                          <span className="forecast-icon">{getWeatherIcon(daily.weathercode[i])}</span>
                          <span className="forecast-temp" style={{ color: 'var(--primary-400)' }}>{Math.round(daily.temperature_2m_max[i])}°</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Math.round(daily.temperature_2m_min[i])}°</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--sky-400)', marginTop: 4 }}>💧{daily.precipitation_sum[i]}mm</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div style={{ textAlign: 'center' }}>
              <a href="/weather" className="btn btn-primary btn-lg">🌤️ Go to Full Weather Page →</a>
            </div>
          </div>
        )}

        {/* MARKET TAB — detailed */}
        {activeTab === 'market' && (
          <div>
            <div className="glass-card" style={{ marginBottom: 24 }}>
              <div className="widget-header">
                <h3>📈 Market Prices {priceSource === 'live' ? <span className="badge badge-success" style={{ fontSize: '0.7rem', marginLeft: 8 }}>● LIVE</span> : ''}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-secondary" onClick={fetchMarket}>🔄 Refresh</button>
                  <a href="/market" className="btn btn-sm btn-primary">Full Market →</a>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <input className="form-input" placeholder="🔍 Search crops..." value={marketSearch} onChange={e => setMarketSearch(e.target.value)}
                  style={{ flex: 1, minWidth: 200 }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ id: 'name', label: 'A-Z' }, { id: 'price-high', label: 'Price ↓' }, { id: 'price-low', label: 'Price ↑' }, { id: 'change', label: 'Trending' }].map(s => (
                    <button key={s.id} className={`btn btn-sm ${marketSort === s.id ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setMarketSort(s.id)}>{s.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {sortedPrices.map((m) => (
                  <a key={m.crop} href="/market" className="market-item" style={{ textDecoration: 'none', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        🌾
                      </div>
                      <div>
                        <div className="market-crop" style={{ fontSize: '1rem' }}>{m.crop}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.unit || '₹/quintal'}</div>
                      </div>
                    </div>
                    <div className="market-price" style={{ fontSize: '1.1rem' }}>₹{Number(m.price).toLocaleString()}</div>
                    <div className={`market-change ${m.change >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '0.9rem' }}>
                      {m.change >= 0 ? '▲' : '▼'} {Math.abs(m.change)}%
                    </div>
                  </a>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <a href="/market" className="btn btn-primary btn-lg" style={{ textAlign: 'center' }}>📈 Price Forecast (LSTM)</a>
              <a href="/market" className="btn btn-secondary btn-lg" style={{ textAlign: 'center' }}>🌾 Crop Recommendation</a>
            </div>
          </div>
        )}

        {/* TOOLS TAB */}
        {activeTab === 'tools' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {[
                { icon: '🔬', title: 'Disease Detection', desc: 'Upload crop images for instant CNN-powered disease diagnosis with MobileNetV2 transfer learning.', tech: 'CNN • MobileNetV2 • PlantVillage', href: '/disease-detect', btnText: '📸 Scan Crop', color: 'var(--primary-500)' },
                { icon: '📈', title: 'Price Prediction', desc: 'Forecast future crop prices using LSTM neural network trained on historical market data.', tech: 'LSTM • Time Series • TensorFlow', href: '/market', btnText: '📊 Predict Prices', color: 'var(--accent-500)' },
                { icon: '🌾', title: 'Crop Recommendation', desc: 'Get AI recommendations on which crop to grow based on soil and weather conditions.', tech: 'Random Forest • Scikit-learn', href: '/market', btnText: '🌱 Get Recommendation', color: '#22c55e' },
                { icon: '💧', title: 'Irrigation Scheduler', desc: 'AI-powered smart irrigation schedules based on live weather and soil moisture data.', tech: 'Gemini AI • Weather API', href: '/irrigation', btnText: '💧 Plan Irrigation', color: '#3b82f6' },
                { icon: '🌤️', title: 'Weather Analytics', desc: 'Detailed agricultural weather forecasts with crop-specific advisories and alerts.', tech: 'Open-Meteo • Forecasting', href: '/weather', btnText: '🌤️ Check Weather', color: '#06b6d4' },
                { icon: '🧠', title: 'AI Decision Support', desc: 'Comprehensive AI farming decisions combining weather, soil, disease, and market data.', tech: 'Gemini AI • Multi-model', href: '/ai-decision', btnText: '🧠 Ask AI', color: '#8b5cf6' },
              ].map(tool => (
                <div key={tool.title} className="glass-card" style={{ display: 'flex', flexDirection: 'column', borderTop: `3px solid ${tool.color}` }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{tool.icon}</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8 }}>{tool.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, flex: 1, marginBottom: 12 }}>{tool.desc}</p>
                  <div style={{ fontSize: '0.72rem', color: 'var(--sky-400)', marginBottom: 16, padding: '4px 0' }}>{tool.tech}</div>
                  <a href={tool.href} className="btn btn-primary" style={{ textAlign: 'center' }}>{tool.btnText}</a>
                </div>
              ))}
            </div>

            {/* System Status */}
            <div className="glass-card" style={{ marginTop: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>🖥️ System Status</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Backend API', status: backendHealth?.status === 'online' ? 'Online' : 'Offline', ok: backendHealth?.status === 'online' },
                  { label: 'CNN Model', status: 'MobileNetV2', ok: true },
                  { label: 'Weather API', status: cur ? 'Connected' : 'Error', ok: !!cur },
                  { label: 'Market Data', status: marketPrices.length > 0 ? 'Active' : 'Error', ok: marketPrices.length > 0 },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(10,15,13,0.4)', borderRadius: 'var(--radius-sm)', border: `1px solid ${s.ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.ok ? 'var(--primary-400)' : 'var(--danger-400)', boxShadow: s.ok ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 8px rgba(239,68,68,0.5)' }}></div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.label}</div>
                      <div style={{ fontSize: '0.75rem', color: s.ok ? 'var(--primary-400)' : 'var(--danger-400)' }}>{s.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-stats { margin-bottom: 32px; }
        .stat-mini { display: flex; align-items: center; gap: 16px; padding: 20px; position: relative; overflow: hidden; }
        .stat-mini:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(34,197,94,0.15); border-color: var(--primary-700); }
        .stat-mini::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--gradient-accent); opacity: 0; transition: opacity 0.3s; }
        .stat-mini:hover::after { opacity: 1; }
        .stat-mini-icon { font-size: 2rem; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; background: rgba(34,197,94,0.08); border-radius: var(--radius-md); }
        .stat-mini-value { font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; }
        .stat-mini-label { color: var(--text-secondary); font-size: 0.85rem; }
        .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .widget-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 8px; }
        .widget-header h3 { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; }
        .weather-main { display: flex; align-items: center; gap: 24px; margin-bottom: 24px; }
        .weather-temp { font-family: var(--font-display); font-size: 3.5rem; font-weight: 800; background: var(--gradient-accent); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .weather-details { display: flex; flex-direction: column; gap: 4px; color: var(--text-secondary); font-size: 0.9rem; }
        .weather-forecast { display: flex; gap: 12px; justify-content: space-between; }
        .forecast-day { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 14px; background: rgba(34,197,94,0.05); border-radius: var(--radius-sm); flex: 1; transition: all 0.2s; }
        .forecast-day:hover { background: rgba(34,197,94,0.12); transform: translateY(-2px); }
        .forecast-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
        .forecast-icon { font-size: 1.4rem; }
        .forecast-temp { font-weight: 600; font-size: 0.9rem; }
        .market-list { display: flex; flex-direction: column; gap: 10px; }
        .market-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: rgba(10,15,13,0.4); border-radius: var(--radius-sm); border: 1px solid var(--border-glass); transition: all 0.2s; }
        .market-item:hover { background: rgba(34,197,94,0.06); border-color: var(--primary-800); transform: translateX(4px); }
        .market-crop { font-weight: 600; min-width: 80px; }
        .market-price { font-family: var(--font-display); font-weight: 700; font-size: 1rem; }
        .market-change { font-size: 0.85rem; font-weight: 600; min-width: 70px; text-align: right; }
        .market-change.positive { color: var(--primary-400); }
        .market-change.negative { color: var(--danger-400); }
        .actions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .action-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px 12px; background: rgba(10,15,13,0.4); border: 1px solid var(--border-glass); border-radius: var(--radius-md); transition: all var(--transition-base); text-decoration: none; position: relative; overflow: hidden; }
        .action-btn::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--action-color); opacity: 0; transition: opacity 0.3s; }
        .action-btn:hover { background: rgba(34,197,94,0.08); border-color: var(--border-subtle); transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
        .action-btn:hover::before { opacity: 1; }
        .action-icon { font-size: 1.8rem; }
        .action-label { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
        .tabs { display: flex; gap: 4px; background: rgba(10,15,13,0.4); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-glass); flex-wrap: wrap; }
        .tab { padding: 10px 20px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: var(--radius-sm); font-size: 0.88rem; font-weight: 500; transition: all 0.2s; }
        .tab:hover { color: var(--text-primary); background: rgba(34,197,94,0.06); }
        .tab.active { background: rgba(34,197,94,0.12); color: var(--primary-400); font-weight: 600; }
        @media (max-width: 768px) {
          .dashboard-grid { grid-template-columns: 1fr; }
          .actions-grid { grid-template-columns: repeat(2, 1fr); }
          .grid-4 { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
