'use client';
import { useState } from 'react';

const WEATHER_ICONS = { 0: '☀️', 1: '☀️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️', 71: '❄️', 73: '❄️', 75: '❄️', 80: '🌧️', 81: '🌧️', 82: '🌧️', 95: '⛈️', 96: '⛈️', 99: '⛈️' };
const getIcon = (code) => WEATHER_ICONS[code] ?? (code <= 1 ? '☀️' : code <= 3 ? '⛅' : code <= 48 ? '🌫️' : code <= 67 ? '🌧️' : code <= 77 ? '❄️' : '⛈️');
const getLabel = (code) => code <= 1 ? 'Clear Sky' : code <= 3 ? 'Partly Cloudy' : code <= 48 ? 'Foggy' : code <= 57 ? 'Drizzle' : code <= 67 ? 'Rain' : code <= 77 ? 'Snow' : code <= 82 ? 'Rain Showers' : 'Thunderstorm';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeatherPage() {
  const [locationInput, setLocationInput] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('');

  const fetchWeather = async () => {
    const q = locationInput.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setWeather(null);

    try {
      const res = await fetch(`/api/weather/?name=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setWeather(data);
        setDisplayName(data.location || q);
      }
    } catch (e) {
      setError('Could not connect to backend. Ensure python main.py is running on port 8000.');
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') fetchWeather(); };

  const getAdvisories = (weathercode, tempMax, rain) => {
    const list = [];
    if (rain > 10) list.push({ type: 'warning', text: '🌧️ Heavy rainfall expected. Delay pesticide spraying and irrigation.' });
    if (rain > 0 && rain <= 10) list.push({ type: 'info', text: '🌦️ Light rain expected. Good for transplanting seedlings.' });
    if (tempMax > 38) list.push({ type: 'danger', text: '🌡️ Extreme heat! Provide shade to sensitive crops and increase watering frequency.' });
    else if (tempMax > 32) list.push({ type: 'warning', text: '☀️ High temperatures. Ensure adequate irrigation and mulching.' });
    if (weathercode >= 95) list.push({ type: 'danger', text: '⛈️ Thunderstorm warning! Avoid open field work.' });
    if (rain === 0 && tempMax < 32) list.push({ type: 'success', text: '✅ Excellent weather for field operations, spraying, and harvesting.' });
    return list;
  };

  const borderColor = (type) => type === 'danger' ? 'var(--danger-500)' : type === 'warning' ? 'var(--accent-500)' : type === 'success' ? 'var(--primary-500)' : 'var(--sky-500)';

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>🌤️ Weather Forecast</h1>
          <p>Enter any city, town, village, or rural area worldwide for live agricultural weather insights</p>
        </div>

        {/* Search Box */}
        <div className="search-section">
          <div className="search-label">
            <span className="search-label-icon">📍</span>
            <span>Search Location</span>
          </div>
          <div className="search-row">
            <input
              type="text"
              className="form-input search-input"
              placeholder="Enter city, village, or region — e.g. Nalgonda, Wayanad, São Paulo..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="btn btn-primary search-btn"
              onClick={fetchWeather}
              disabled={loading || !locationInput.trim()}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Fetching...</>
              ) : (
                'Get Weather'
              )}
            </button>
          </div>
          <div className="quick-picks">
            <span className="quick-picks-label">Popular:</span>
            {['Delhi', 'Mumbai', 'Wayanad', 'Nalgonda', 'Kathmandu', 'Kampala'].map(c => (
              <button
                key={c}
                className={`quick-pick ${locationInput === c ? 'active' : ''}`}
                onClick={() => setLocationInput(c)}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="glass-card" style={{ padding: 24, textAlign: 'center', marginBottom: 24, border: '1px solid var(--danger-500)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>⚠️</div>
            <h3 style={{ color: 'var(--danger-500)', marginBottom: 8 }}>Could Not Load Weather</h3>
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!weather && !loading && !error && (
          <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', marginBottom: 20 }}>🌍</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', marginBottom: 12 }}>Search Any Location Worldwide</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto' }}>
              Type any city, district, village, or rural area — even small farming regions are supported. Our system uses live weather data from Open-Meteo and AI geocoding to find any location.
            </p>
          </div>
        )}

        {/* Results */}
        {weather && !loading && weather.current_weather && weather.daily && (
          <>
            {/* Current Conditions Card */}
            <div className="glass-card" style={{ marginBottom: 24, padding: 32, background: 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(10,15,13,0.8) 100%)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--primary-400)', fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    📍 {displayName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <span style={{ fontSize: '5rem', lineHeight: 1 }}>{getIcon(weather.current_weather.weathercode)}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '4rem', fontWeight: 900, background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                        {weather.current_weather.temperature}°C
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: 4 }}>
                        {getLabel(weather.current_weather.weathercode)}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Wind Speed', value: `${weather.current_weather.windspeed} km/h`, icon: '💨' },
                    { label: 'Precipitation', value: `${weather.daily.precipitation_sum[0]} mm`, icon: '🌧️' },
                    { label: 'Today High', value: `${weather.daily.temperature_2m_max[0]}°C`, icon: '🌡️', color: 'var(--danger-400)' },
                    { label: 'Today Low', value: `${weather.daily.temperature_2m_min[0]}°C`, icon: '❄️', color: 'var(--sky-400)' },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '14px 18px', background: 'rgba(10,15,13,0.5)', borderRadius: 'var(--radius-sm)', textAlign: 'center', minWidth: 110 }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontWeight: 700, color: s.color || 'white' }}>{s.icon} {s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Agricultural Advisory */}
            <div className="glass-card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>🌾 Agricultural Advisory</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {getAdvisories(weather.current_weather.weathercode, weather.daily.temperature_2m_max[0], weather.daily.precipitation_sum[0]).map((a, i) => (
                  <div key={i} style={{ padding: '14px 18px', borderRadius: 'var(--radius-sm)', borderLeft: `4px solid ${borderColor(a.type)}`, background: 'rgba(10,15,13,0.4)', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>{a.text}</div>
                ))}
              </div>
            </div>

            {/* 7-Day Forecast */}
            <div className="glass-card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>📅 7-Day Forecast</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
                {weather.daily.time.map((date, i) => {
                  const d = new Date(date);
                  return (
                    <div key={date} style={{ textAlign: 'center', padding: '16px 8px', background: i === 0 ? 'rgba(34,197,94,0.1)' : 'rgba(10,15,13,0.4)', borderRadius: 'var(--radius-md)', border: i === 0 ? '1px solid rgba(34,197,94,0.25)' : '1px solid var(--border-glass)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>{i === 0 ? 'Today' : DAY_NAMES[d.getDay()]}</div>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>{getIcon(weather.daily.weathercode[i])}</div>
                      <div style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>{Math.round(weather.daily.temperature_2m_max[i])}°</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{Math.round(weather.daily.temperature_2m_min[i])}°</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--sky-400)', marginTop: 8 }}>💧{weather.daily.precipitation_sum[i]}mm</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .search-section {
          background: linear-gradient(145deg, rgba(22, 101, 52, 0.12) 0%, rgba(10, 15, 13, 0.85) 100%);
          border: 1px solid rgba(34, 197, 94, 0.15);
          border-radius: var(--radius-lg);
          padding: 28px;
          margin-bottom: 32px;
        }
        .search-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .search-label-icon {
          font-size: 1rem;
        }
        .search-row {
          display: flex;
          gap: 12px;
          align-items: stretch;
        }
        .search-input {
          flex: 1;
          min-width: 0;
          padding: 14px 18px !important;
          font-size: 1rem !important;
          background: rgba(10, 15, 13, 0.7) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: var(--radius-md) !important;
          color: var(--text-primary);
          transition: all 0.2s ease;
        }
        .search-input:focus {
          border-color: var(--primary-500) !important;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12) !important;
          background: rgba(10, 15, 13, 0.9) !important;
        }
        .search-input::placeholder {
          color: var(--text-muted);
          font-size: 0.92rem;
        }
        .search-btn {
          padding: 14px 28px !important;
          font-weight: 700 !important;
          font-size: 0.95rem !important;
          white-space: nowrap;
          border-radius: var(--radius-md) !important;
          min-width: 150px;
        }
        .quick-picks {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          flex-wrap: wrap;
        }
        .quick-picks-label {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 500;
          margin-right: 2px;
        }
        .quick-pick {
          padding: 5px 14px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .quick-pick:hover {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
          color: var(--primary-400);
        }
        .quick-pick.active {
          background: rgba(34, 197, 94, 0.15);
          border-color: var(--primary-500);
          color: var(--primary-400);
        }
        @media (max-width: 640px) {
          .search-row {
            flex-direction: column;
          }
          .search-btn {
            min-width: unset;
          }
        }
      `}</style>
    </div>
  );
}
