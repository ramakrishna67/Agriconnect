'use client';
import { useState } from 'react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function IrrigationPage() {
  const [locationInput, setLocationInput] = useState('');
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('');

  const fetchSchedule = async () => {
    const q = locationInput.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setSchedule(null);

    try {
      const res = await fetch(`/api/irrigation/schedule?name=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSchedule(data);
        setDisplayName(data.location || q);
      }
    } catch (e) {
      setError('Could not connect to backend. Ensure python main.py is running on port 8000.');
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') fetchSchedule(); };

  const getRainIcon = (mm) => mm > 10 ? '🌧️' : mm > 0 ? '🌦️' : '☀️';

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>💧 Smart Irrigation</h1>
          <p>Enter any location to get an AI-powered, live-data irrigation schedule for your farm</p>
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
              placeholder="Enter city, village, or region — e.g. Nalgonda, Wayanad, Punjab..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="btn btn-primary search-btn"
              onClick={fetchSchedule}
              disabled={loading || !locationInput.trim()}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Analyzing...</>
              ) : (
                'Generate Schedule'
              )}
            </button>
          </div>
          <div className="quick-picks">
            <span className="quick-picks-label">Popular:</span>
            {['Nalgonda', 'Wayanad', 'Punjab', 'Rajasthan', 'Nairobi', 'Fergana Valley'].map(c => (
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
            <h3 style={{ color: 'var(--danger-500)', marginBottom: 8 }}>Schedule Generation Failed</h3>
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!schedule && !loading && !error && (
          <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', marginBottom: 20 }}>🌾</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', marginBottom: 12 }}>AI-Powered Irrigation for Any Location</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto', lineHeight: 1.7 }}>
              Our AI fetches real-time weather data for your specific location, calculates soil moisture trends, and generates a precise 7-day irrigation schedule tailored to your region's conditions.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 20, animation: 'pulse-glow 2s infinite' }}>💧</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>Generating AI Irrigation Schedule</h3>
            <p style={{ color: 'var(--text-muted)' }}>Fetching live weather data and computing optimal irrigation plan...</p>
          </div>
        )}

        {/* Results */}
        {schedule && !loading && (
          <>
            {/* Location Header */}
            <div className="glass-card" style={{ marginBottom: 24, padding: 24, background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(10,15,13,0.8) 100%)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary-400)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>📍 Location</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>{displayName}</div>
                  {schedule.lat && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Coordinates: {Number(schedule.lat).toFixed(2)}°N, {Number(schedule.lon).toFixed(2)}°E</div>}
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ textAlign: 'center', padding: '16px 20px', background: 'rgba(10,15,13,0.5)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Soil Moisture</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--sky-400)' }}>{schedule.soil_moisture}</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px 20px', background: 'rgba(10,15,13,0.5)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Temperature</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-400)' }}>{schedule.current_temp}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
              <div className="glass-card" style={{ border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: '2rem', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-md)' }}>⏱️</div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Best Watering Time</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{schedule.timing}</div>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ border: '1px solid rgba(6,182,212,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: '2rem', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,182,212,0.1)', borderRadius: 'var(--radius-md)' }}>📊</div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--sky-400)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Weekly Water Requirement</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{schedule.water_requirement}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Day Schedule */}
            <div className="glass-card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>📅 7-Day Irrigation Schedule</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, padding: '16px 20px', background: 'rgba(34,197,94,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34,197,94,0.1)', marginBottom: 20 }}>
                {schedule.schedule}
              </p>
              {schedule.forecast?.dates?.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                  {schedule.forecast.dates.map((date, i) => {
                    const d = new Date(date);
                    const rain = schedule.forecast.rainfall[i] || 0;
                    return (
                      <div key={date} style={{ textAlign: 'center', padding: '12px 6px', background: i === 0 ? 'rgba(34,197,94,0.1)' : 'rgba(10,15,13,0.4)', borderRadius: 'var(--radius-md)', border: i === 0 ? '1px solid rgba(34,197,94,0.25)' : '1px solid var(--border-glass)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>{i === 0 ? 'Today' : DAY_NAMES[d.getDay()]}</div>
                        <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{getRainIcon(rain)}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{schedule.forecast.max_temps[i]}°</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--sky-400)', marginTop: 4 }}>💧{rain}mm</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Expert Advice */}
            <div className="glass-card" style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--gradient-accent)' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: '2rem' }}>🤖</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0 }}>AI Expert Advice</h3>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Gemini Powered</span>
              </div>
              <p style={{ color: 'white', lineHeight: 1.8, fontSize: '1rem' }}>{schedule.advice}</p>
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
          min-width: 170px;
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
