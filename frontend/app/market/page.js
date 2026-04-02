'use client';
import { useState } from 'react';

const crops = [
  'Banana', 'Bhindi(Ladies Finger)', 'Bitter gourd', 'Black Gram (Urd Beans)(Whole)',
  'Brinjal', 'Cabbage', 'Carrot', 'Cashewnuts', 'Coconut', 'Copra', 'Cotton',
  'French Beans (Frasbean)', 'Green Chilli', 'Green Gram (Moong)(Whole)',
  'Gur(Jaggery)', 'Maize', 'Mango', 'Onion', 'Paddy(Dhan)(Common)',
  'Ridgeguard(Tori)', 'Sesamum(Sesame,Gingelly,Til)', 'Tomato', 'Turmeric'
];


export default function MarketPage() {
  const [activeTab, setActiveTab] = useState('predict-price');
  const [priceForm, setPriceForm] = useState({ crop: 'Tomato', months_ahead: '3' });
  const [recForm, setRecForm] = useState({ nitrogen: '80', phosphorus: '45', potassium: '40', temperature: '27', humidity: '75', ph: '6.5', rainfall: '180' });
  const [priceResult, setPriceResult] = useState(null);
  const [recResult, setRecResult] = useState(null);
  const [demandResult, setDemandResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demandLoading, setDemandLoading] = useState(false);


  const API = '';

  const predictPrice = async () => {
    setLoading(true);
    setPriceResult(null);
    try {
      const res = await fetch(`${API}/api/market/predict-price`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop: priceForm.crop, months_ahead: parseInt(priceForm.months_ahead) }),
      });
      const data = await res.json();
      setPriceResult(data);
    } catch (err) {
      console.error('Price prediction error:', err);
      setPriceResult({ error: 'Failed to connect to backend. Make sure the server is running on port 8000.' });
    }
    setLoading(false);
  };

  const predictDemand = async () => {
    if (!priceResult || !priceResult.crop) return;
    setDemandLoading(true);
    setDemandResult(null);
    try {
      const { crop, current_price, trend } = priceResult;
      const res = await fetch(`${API}/api/market/demand-forecast`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop, current_price, trend, months_ahead: parseInt(priceForm.months_ahead) }),
      });
      const data = await res.json();
      setDemandResult(data);
    } catch (err) {
      console.error('Demand prediction error:', err);
      setDemandResult({ error: 'Failed to connect to AI for demand forecasting.' });
    }
    setDemandLoading(false);
  };

  const recommendCrop = async () => {

    setLoading(true);
    setRecResult(null);
    try {
      const body = { nitrogen: parseFloat(recForm.nitrogen), phosphorus: parseFloat(recForm.phosphorus), potassium: parseFloat(recForm.potassium), temperature: parseFloat(recForm.temperature), humidity: parseFloat(recForm.humidity), ph: parseFloat(recForm.ph), rainfall: parseFloat(recForm.rainfall) };
      const res = await fetch(`${API}/api/market/recommend-crop`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setRecResult(data);
    } catch (err) {
      console.error('Crop recommendation error:', err);
      setRecResult({ error: 'Failed to connect to backend. Make sure the server is running on port 8000.' });
    }
    setLoading(false);
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>📊 Market Intelligence</h1>
          <p>LSTM price forecasting and AI-powered crop recommendations</p>
        </div>

        <div className="tabs">
          {[['predict-price', '🔮 Price Forecast (LSTM)'], ['recommend', '🌾 Crop Recommendation']].map(([key, label]) => (
            <button key={key} className={`tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>{label}</button>
          ))}
        </div>

        {/* === PRICE FORECAST (LSTM) TAB === */}
        {activeTab === 'predict-price' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
            <div className="glass-card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>🔮 Price Forecast</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>Uses <strong style={{ color: 'var(--primary-400)' }}>LSTM (Long Short-Term Memory)</strong> neural network for time-series price forecasting</p>
              <div className="form-group">
                <label className="form-label">Crop</label>
                <select className="form-select" value={priceForm.crop} onChange={e => setPriceForm({ ...priceForm, crop: e.target.value })}>
                  {crops.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Months Ahead</label>
                <select className="form-select" value={priceForm.months_ahead} onChange={e => setPriceForm({ ...priceForm, months_ahead: e.target.value })}>
                  {[1, 2, 3, 4, 5, 6].map(m => <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={predictPrice} disabled={loading}>
                {loading ? '⟳ Forecasting...' : '🔮 Forecast Price (LSTM)'}
              </button>
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(14,165,233,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(14,165,233,0.15)', fontSize: '0.82rem', color: 'var(--sky-400)' }}>
                💡 LSTM analyzes 12-month historical sequences to predict future price trends
              </div>
            </div>
            <div>
              {!priceResult ? (
                <div className="glass-card" style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="empty-state"><div className="empty-icon">📈</div><h3>No Forecast Yet</h3><p>Select a crop and click forecast</p></div>
                </div>
              ) : priceResult.error ? (
                <div className="glass-card" style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="empty-state"><div className="empty-icon">⚠️</div><h3>Error</h3><p style={{ color: 'var(--danger-400)' }}>{priceResult.error}</p></div>
                </div>
              ) : (
                <div className="glass-card">
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Current Price — {priceResult.crop}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>₹{Math.round(priceResult.current_price).toLocaleString()}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{priceResult.unit}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                    <span className="badge badge-info">Model: LSTM</span>
                    <span className={`badge ${priceResult.trend === 'upward' ? 'badge-success' : 'badge-warning'}`}>Trend: {priceResult.trend}</span>
                    <span className="badge badge-info">Sequence: {priceResult.sequence_length} months</span>
                    {priceResult.dataset && <span className="badge badge-info">{priceResult.dataset}</span>}
                  </div>
                  {priceResult.historical && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                      <div style={{ padding: 10, background: 'rgba(10,15,13,0.4)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Historical Min</div>
                        <div style={{ fontWeight: 700, color: 'var(--danger-400)' }}>₹{Math.round(priceResult.historical.min_price).toLocaleString()}</div>
                      </div>
                      <div style={{ padding: 10, background: 'rgba(10,15,13,0.4)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Historical Avg</div>
                        <div style={{ fontWeight: 700, color: 'var(--accent-400)' }}>₹{Math.round(priceResult.historical.avg_price).toLocaleString()}</div>
                      </div>
                      <div style={{ padding: 10, background: 'rgba(10,15,13,0.4)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Historical Max</div>
                        <div style={{ fontWeight: 700, color: 'var(--primary-400)' }}>₹{Math.round(priceResult.historical.max_price).toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>📅 Forecast</h4>
                  {(priceResult.forecast || []).map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(10,15,13,0.4)', borderRadius: 'var(--radius-sm)', marginBottom: 8, borderLeft: `3px solid ${f.change_percent >= 0 ? 'var(--primary-500)' : 'var(--danger-500)'}` }}>
                      <span style={{ fontWeight: 600 }}>{f.month}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>₹{Math.round(f.predicted_price).toLocaleString()}</span>
                      <span style={{ color: f.change_percent >= 0 ? 'var(--primary-400)' : 'var(--danger-400)', fontWeight: 600, fontSize: '0.9rem' }}>{f.change_percent >= 0 ? '▲' : '▼'} {Math.abs(f.change_percent)}%</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 16, padding: 12, background: 'rgba(34,197,94,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(34,197,94,0.15)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {priceResult.confidence_note}
                  </div>
                  
                  {/* Demand Forecast Section */}
                  <div style={{ marginTop: 24, padding: 20, background: 'rgba(14,165,233,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(14,165,233,0.3)', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ fontFamily: 'var(--font-display)', margin: 0, fontWeight: 700, color: 'var(--sky-400)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        ✨ AI Demand & Selling Strategy
                      </h4>
                    </div>

                    {!demandResult && !demandLoading && (
                      <button className="btn btn-primary btn-sm" onClick={predictDemand} style={{ width: '100%' }}>
                         Analyze Market Strategy
                      </button>
                    )}

                    {demandLoading && <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--sky-400)' }}><span className="typing-dots">...</span> Analyzing trends with Gemini...</div>}

                    {demandResult && !demandResult.error && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div style={{ padding: 12, background: 'rgba(10,15,13,0.5)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Demand Outlook</div>
                            <div style={{ fontWeight: 700, color: demandResult.demand_outlook.toLowerCase() === 'high' ? 'var(--primary-400)' : 'var(--accent-400)' }}>{demandResult.demand_outlook}</div>
                          </div>
                          <div style={{ padding: 12, background: 'rgba(10,15,13,0.5)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Best Time To Sell</div>
                            <div style={{ fontWeight: 700, color: 'var(--primary-400)' }}>{demandResult.best_time_to_sell}</div>
                          </div>
                        </div>
                        <div style={{ padding: 16, background: 'rgba(10,15,13,0.5)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--sky-500)' }}>
                           <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Expert Selling Strategy</div>
                           <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{demandResult.selling_strategy}</div>
                        </div>
                      </div>
                    )}
                    
                    {demandResult?.error && <div style={{ color: 'var(--danger-400)', fontSize: '0.9rem', textAlign: 'center' }}>⚠️ {demandResult.error}</div>}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* === CROP RECOMMENDATION TAB === */}
        {activeTab === 'recommend' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
            <div className="glass-card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>🌾 Crop Recommendation</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>Uses <strong style={{ color: 'var(--accent-400)' }}>Random Forest</strong> to recommend best crops for your soil and climate</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Nitrogen (N)</label><input className="form-input" type="number" value={recForm.nitrogen} onChange={e => setRecForm({ ...recForm, nitrogen: e.target.value })} placeholder="kg/ha" /></div>
                <div className="form-group"><label className="form-label">Phosphorus (P)</label><input className="form-input" type="number" value={recForm.phosphorus} onChange={e => setRecForm({ ...recForm, phosphorus: e.target.value })} placeholder="kg/ha" /></div>
                <div className="form-group"><label className="form-label">Potassium (K)</label><input className="form-input" type="number" value={recForm.potassium} onChange={e => setRecForm({ ...recForm, potassium: e.target.value })} placeholder="kg/ha" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Temperature (°C)</label><input className="form-input" type="number" value={recForm.temperature} onChange={e => setRecForm({ ...recForm, temperature: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Humidity (%)</label><input className="form-input" type="number" value={recForm.humidity} onChange={e => setRecForm({ ...recForm, humidity: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Soil pH</label><input className="form-input" type="number" step="0.1" value={recForm.ph} onChange={e => setRecForm({ ...recForm, ph: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Rainfall (mm)</label><input className="form-input" type="number" value={recForm.rainfall} onChange={e => setRecForm({ ...recForm, rainfall: e.target.value })} /></div>
              </div>
              <button className="btn btn-gold btn-lg" style={{ width: '100%' }} onClick={recommendCrop} disabled={loading}>
                {loading ? '⟳ Analyzing...' : '🌾 Get Crop Recommendations'}
              </button>
            </div>
            <div>
              {!recResult ? (
                <div className="glass-card" style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="empty-state"><div className="empty-icon">🌾</div><h3>No Recommendations Yet</h3><p>Enter soil and climate data to get started</p></div>
                </div>
              ) : (
                <>
                  <div className="glass-card" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>🌾 Recommended Crops</h3>
                      <span className="badge badge-info">Model: {recResult.model}</span>
                    </div>
                    {recResult.recommendations.map((rec, i) => (
                      <div key={i} style={{ padding: 16, background: i === 0 ? 'rgba(34,197,94,0.08)' : 'rgba(10,15,13,0.4)', borderRadius: 'var(--radius-md)', marginBottom: 10, border: i === 0 ? '1px solid rgba(34,197,94,0.2)' : '1px solid var(--border-glass)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: '1.5rem', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-sm)' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🌱'}</span>
                            <div>
                              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>{rec.crop}</div>
                              <div style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span>{rec.crop_type}</span> • <span>{rec.season}</span> • <span>{rec.duration}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: rec.confidence > 70 ? 'var(--primary-400)' : rec.confidence > 40 ? 'var(--accent-400)' : 'var(--text-muted)' }}>{rec.confidence}%</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>match</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ padding: '2px 10px', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 20, fontSize: '0.75rem', color: 'var(--sky-400)' }}>💧 {rec.water_requirement}</span>
                          {rec.suitability_reasons?.slice(0, 3).map((r, j) => (
                            <span key={j} style={{ fontSize: '0.78rem', color: 'var(--primary-300)' }}>{r}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {recResult.soil_analysis && (
                    <div className="glass-card">
                      <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12 }}>🧪 Soil Analysis</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {Object.entries(recResult.soil_analysis).map(([key, val]) => (
                          <div key={key} style={{ padding: 12, background: 'rgba(10,15,13,0.4)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-500)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key}</div>
                            <div style={{ fontWeight: 700 }}>{val.value} <span style={{ fontSize: '0.8rem', color: val.status === 'High' ? 'var(--primary-400)' : val.status === 'Low' ? 'var(--danger-400)' : 'var(--accent-400)' }}>({val.status})</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
