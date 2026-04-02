'use client';
import { useState, useRef, useEffect } from 'react';

export default function AIDecisionPage() {
  const [areaName, setAreaName] = useState('');
  const [cropType, setCropType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [listeningField, setListeningField] = useState(null);
  const [speakingSection, setSpeakingSection] = useState(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const resultsRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = navigator.language || 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => { setIsListening(false); setListeningField(null); };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (listeningField === 'area') {
          setAreaName(transcript);
        } else if (listeningField === 'crop') {
          setCropType(transcript);
        }
      };
      recognitionRef.current = recognition;
    }
  }, [listeningField]);

  const startListening = (field) => {
    setListeningField(field);
    try {
      recognitionRef.current?.start();
    } catch (e) {
      console.error('Speech recognition error', e);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const speakText = (text, sectionName) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = navigator.language || 'en-US';
      utterance.rate = 0.9;
      utterance.onstart = () => setSpeakingSection(sectionName);
      utterance.onend = () => setSpeakingSection(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingSection(null);
    }
  };

  const handleAnalyze = async () => {
    if (!areaName.trim() || !cropType.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const stages = [
      { key: 'geocode', label: '📍 Finding your location...' },
      { key: 'weather', label: '🌤️ Fetching weather data...' },
      { key: 'soil', label: '🌱 Analyzing soil conditions...' },
      { key: 'disease', label: '🔬 Running disease detection...' },
      { key: 'price', label: '📈 Predicting crop prices...' },
      { key: 'recommendations', label: '🌾 Finding best crops...' },
      { key: 'decision', label: '🧠 Generating AI decision...' },
    ];

    // Animate through stages
    let stageIdx = 0;
    const stageInterval = setInterval(() => {
      if (stageIdx < stages.length) {
        setCurrentStage(stages[stageIdx].label);
        stageIdx++;
      }
    }, 2000);

    try {
      const formData = new FormData();
      formData.append('area_name', areaName.trim());
      formData.append('crop_type', cropType.trim());
      formData.append('language', navigator.language || 'en');
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch('/api/decision/analyze', {
        method: 'POST',
        body: formData,
      });

      clearInterval(stageInterval);

      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setResult(data);
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        }
      } else {
        setError('Backend returned an error. Make sure the backend server is running.');
      }
    } catch (e) {
      clearInterval(stageInterval);
      setError('Could not connect to backend. Please ensure python main.py is running on port 8000.');
    }
    setLoading(false);
    setCurrentStage('');
  };

  const decision = result?.decision;
  const weather = result?.weather;
  const soil = result?.soil;
  const disease = result?.disease;
  const price = result?.price_prediction;
  const recommendations = result?.crop_recommendations;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header" style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1>🧠 AI-Based Decision Support System</h1>
          <p style={{ maxWidth: 700, margin: '0 auto' }}>
            Enter your area, crop type, and optionally upload a crop image. Our AI analyzes weather, soil, diseases, market prices, and recommends the best farming decisions — with voice support in your language.
          </p>
        </div>

        {/* INPUT SECTION */}
        <div className="glass-card" style={{ maxWidth: 900, margin: '0 auto 40px', padding: 32 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 24, fontSize: '1.3rem' }}>
            📝 Enter Your Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Area Name */}
            <div className="form-group">
              <label className="form-label">📍 Area / Village Name</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Guntur, Warangal, Nashik..."
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className={`btn ${isListening && listeningField === 'area' ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => isListening && listeningField === 'area' ? stopListening() : startListening('area')}
                  title="Speak area name"
                  style={{ padding: '10px 14px', fontSize: '1.1rem' }}
                >
                  {isListening && listeningField === 'area' ? '⏹️' : '🎙️'}
                </button>
              </div>
              {isListening && listeningField === 'area' && (
                <div style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--primary-400)', animation: 'pulse-glow 1.5s infinite' }}>
                  🔴 Listening... speak your area name
                </div>
              )}
            </div>

            {/* Crop Type */}
            <div className="form-group">
              <label className="form-label">🌾 Crop Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rice, Wheat, Cotton, Tomato..."
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className={`btn ${isListening && listeningField === 'crop' ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => isListening && listeningField === 'crop' ? stopListening() : startListening('crop')}
                  title="Speak crop type"
                  style={{ padding: '10px 14px', fontSize: '1.1rem' }}
                >
                  {isListening && listeningField === 'crop' ? '⏹️' : '🎙️'}
                </button>
              </div>
              {isListening && listeningField === 'crop' && (
                <div style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--primary-400)', animation: 'pulse-glow 1.5s infinite' }}>
                  🔴 Listening... speak your crop type
                </div>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="form-group" style={{ marginTop: 8 }}>
            <label className="form-label">📸 Crop Image (Optional — for disease detection)</label>
            <div
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: preview ? 12 : 32,
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(10,15,13,0.4)',
                minHeight: preview ? 'auto' : 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.25s',
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]); }}
            >
              {preview ? (
                <img src={preview} alt="Crop" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: '2rem' }}>📷</div>
                  <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>Drag & drop or click to upload crop image</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>AI will detect diseases if present</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files[0])} style={{ display: 'none' }} />
            </div>
            {selectedFile && (
              <button className="btn btn-secondary" style={{ marginTop: 8, fontSize: '0.8rem' }} onClick={() => { setSelectedFile(null); setPreview(null); }}>
                ✕ Remove Image
              </button>
            )}
          </div>

          {/* Analyze Button */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleAnalyze}
              disabled={!areaName.trim() || !cropType.trim() || loading}
              style={{ minWidth: 280, fontSize: '1.1rem', padding: '16px 40px' }}
            >
              {loading ? '⟳ Analyzing...' : '🧠 Get AI Recommendation'}
            </button>
          </div>
        </div>

        {/* LOADING ANIMATION */}
        {loading && (
          <div className="glass-card" style={{ maxWidth: 600, margin: '0 auto 40px', textAlign: 'center', padding: 48 }}>
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>
              Analyzing Your Farm Data
            </p>
            <p style={{ color: 'var(--primary-400)', fontSize: '0.95rem', animation: 'fadeIn 0.5s' }}>
              {currentStage || '📍 Starting analysis...'}
            </p>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 6 }}>
              {['geocode', 'weather', 'soil', 'disease', 'price', 'recommendations', 'decision'].map((s, i) => (
                <div key={s} style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: `var(--primary-${i < 4 ? '500' : '700'})`,
                  opacity: 0.3,
                  animation: `pulse-glow 1.5s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && !loading && (
          <div className="glass-card" style={{ maxWidth: 600, margin: '0 auto 40px', textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
            <h3 style={{ color: 'var(--danger-500)', marginBottom: 8 }}>Analysis Failed</h3>
            <p style={{ color: 'var(--text-muted)' }}>{error}</p>
          </div>
        )}

        {/* RESULTS */}
        {result && decision && (
          <div ref={resultsRef} style={{ maxWidth: 1100, margin: '0 auto' }}>
            {/* VERDICT BANNER */}
            <div className="glass-card" style={{
              marginBottom: 24,
              padding: '32px 40px',
              borderLeft: `4px solid ${decision.overall_verdict === 'RECOMMENDED' ? 'var(--primary-500)' : decision.overall_verdict === 'CHANGE CROP' ? 'var(--danger-500)' : 'var(--accent-500)'}`,
              background: decision.overall_verdict === 'RECOMMENDED'
                ? 'linear-gradient(135deg, rgba(22,101,52,0.25), rgba(10,15,13,0.8))'
                : decision.overall_verdict === 'CHANGE CROP'
                  ? 'linear-gradient(135deg, rgba(127,29,29,0.2), rgba(10,15,13,0.8))'
                  : 'linear-gradient(135deg, rgba(120,80,0,0.2), rgba(10,15,13,0.8))'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 300 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '2.2rem' }}>
                      {decision.overall_verdict === 'RECOMMENDED' ? '✅' : decision.overall_verdict === 'CHANGE CROP' ? '🔄' : '⚠️'}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>AI Verdict</div>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800,
                        background: decision.overall_verdict === 'RECOMMENDED' ? 'var(--gradient-accent)' : 'linear-gradient(135deg, var(--accent-400), var(--danger-400))',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                      }}>
                        {decision.overall_verdict}
                      </div>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7 }}>
                    {decision.verdict_reason}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  {decision.crop_analysis && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900,
                        color: decision.crop_analysis.suitability_score >= 70 ? 'var(--primary-400)' : decision.crop_analysis.suitability_score >= 40 ? 'var(--accent-400)' : 'var(--danger-400)'
                      }}>
                        {decision.crop_analysis.suitability_score}%
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Suitability Score</div>
                    </div>
                  )}
                  <SpeakerButton
                    text={`AI Verdict: ${decision.overall_verdict}. ${decision.verdict_reason}`}
                    section="verdict"
                    speakingSection={speakingSection}
                    onSpeak={speakText}
                    onStop={stopSpeaking}
                  />
                </div>
              </div>
            </div>

            {/* MAIN GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              {/* Weather */}
              <ResultCard
                icon="🌤️" title="Weather Analysis"
                speakerText={decision.weather_advisory}
                section="weather"
                speakingSection={speakingSection}
                onSpeak={speakText}
                onStop={stopSpeaking}
              >
                {weather?.current_weather && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <MiniStat label="Temperature" value={`${weather.current_weather.temperature}°C`} />
                    <MiniStat label="Wind Speed" value={`${weather.current_weather.windspeed} km/h`} />
                    {weather.daily?.precipitation_sum && <MiniStat label="Precipitation" value={`${weather.daily.precipitation_sum[0]} mm`} />}
                    {weather.daily?.temperature_2m_max && <MiniStat label="Max Temp" value={`${weather.daily.temperature_2m_max[0]}°C`} />}
                  </div>
                )}
                <Advisory text={decision.weather_advisory} />
              </ResultCard>

              {/* Soil */}
              <ResultCard
                icon="🌱" title="Soil Analysis"
                speakerText={decision.soil_advisory}
                section="soil"
                speakingSection={speakingSection}
                onSpeak={speakText}
                onStop={stopSpeaking}
              >
                {soil && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <MiniStat label="Nitrogen (N)" value={soil.nitrogen} />
                    <MiniStat label="Phosphorus (P)" value={soil.phosphorus} />
                    <MiniStat label="Potassium (K)" value={soil.potassium} />
                    <MiniStat label="pH Level" value={soil.ph} />
                  </div>
                )}
                {soil?.soil_type && (
                  <div style={{ marginBottom: 12 }}>
                    <span className="badge badge-info">Soil Type: {soil.soil_type}</span>
                  </div>
                )}
                <Advisory text={decision.soil_advisory} />
              </ResultCard>

              {/* Disease Detection */}
              <ResultCard
                icon="🔬" title="Disease Detection"
                speakerText={decision.disease_advisory}
                section="disease"
                speakingSection={speakingSection}
                onSpeak={speakText}
                onStop={stopSpeaking}
              >
                {disease ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: disease.disease === 'Healthy' ? 'var(--primary-400)' : 'var(--accent-400)' }}>
                          {disease.disease}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{disease.crop}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary-400)' }}>
                          {disease.confidence}%
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Confidence</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span className={`badge ${disease.severity === 'High' ? 'badge-danger' : disease.severity === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                        Severity: {disease.severity}
                      </span>
                      {disease.model_info && (
                        <span className="badge badge-info">Model: {disease.model_info.model}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 12 }}>No image uploaded — skipped disease analysis</p>
                )}
                <Advisory text={decision.disease_advisory} />
              </ResultCard>

              {/* Price Prediction */}
              <ResultCard
                icon="📈" title="Market & Price Analysis"
                speakerText={decision.market_advisory}
                section="market"
                speakingSection={speakingSection}
                onSpeak={speakText}
                onStop={stopSpeaking}
              >
                {price && !price.error ? (
                  <div style={{ marginBottom: 16 }}>
                    {price.predictions && price.predictions.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        {price.predictions.slice(0, 3).map((p, i) => (
                          <div key={i} style={{ padding: 12, background: 'rgba(10,15,13,0.5)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{p.month || `Month ${i + 1}`}</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary-400)' }}>
                              ₹{typeof p.price === 'number' ? p.price.toLocaleString() : p.predicted_price?.toLocaleString() || p.price}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {price.current_price && (
                      <div style={{ marginTop: 12, padding: 10, background: 'rgba(10,15,13,0.5)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current: </span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-400)' }}>₹{price.current_price?.toLocaleString() || 'N/A'}/quintal</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 12 }}>
                    {price?.error || 'Price data not available for this crop'}
                  </p>
                )}
                <Advisory text={decision.market_advisory} />
              </ResultCard>
            </div>

            {/* CROP ANALYSIS CARD */}
            {decision.crop_analysis && (
              <div className="glass-card" style={{ marginBottom: 24, padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>
                    🌾 Your Crop: {decision.crop_analysis.farmer_crop}
                  </h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge ${decision.crop_analysis.risk_level === 'Low' ? 'badge-success' : decision.crop_analysis.risk_level === 'High' ? 'badge-danger' : 'badge-warning'}`}>
                      Risk: {decision.crop_analysis.risk_level}
                    </span>
                    <span className={`badge ${decision.crop_analysis.expected_yield_quality === 'High' ? 'badge-success' : 'badge-warning'}`}>
                      Yield: {decision.crop_analysis.expected_yield_quality}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <h4 style={{ color: 'var(--primary-400)', fontSize: '0.9rem', fontWeight: 600, marginBottom: 10 }}>✅ Reasons For</h4>
                    {decision.crop_analysis.reasons_for?.map((r, i) => (
                      <div key={i} style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.08)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-500)', marginBottom: 6, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        {r}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--danger-400)', fontSize: '0.9rem', fontWeight: 600, marginBottom: 10 }}>⚠️ Reasons Against</h4>
                    {decision.crop_analysis.reasons_against?.map((r, i) => (
                      <div key={i} style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--danger-500)', marginBottom: 6, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Benefits */}
                {decision.farmer_crop_benefits && decision.farmer_crop_benefits.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <h4 style={{ color: 'var(--accent-400)', fontSize: '0.9rem', fontWeight: 600, marginBottom: 10 }}>💡 Benefits of Growing {cropType}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {decision.farmer_crop_benefits.map((b, i) => (
                        <div key={i} style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-500)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                          {b}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUGGESTED ALTERNATIVE CROPS */}
            {decision.suggested_crops && decision.suggested_crops.length > 0 && (
              <div className="glass-card" style={{ marginBottom: 24, padding: 28 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', marginBottom: 20 }}>
                  🌟 Suggested Alternative Crops
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {decision.suggested_crops.map((crop, i) => (
                    <div key={i} style={{
                      padding: 20,
                      background: 'rgba(10,15,13,0.5)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>{crop.crop}</div>
                        <span className={`badge ${crop.expected_profit === 'High' ? 'badge-success' : 'badge-warning'}`}>
                          Profit: {crop.expected_profit}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 12, lineHeight: 1.6 }}>{crop.why}</p>
                      {crop.benefits && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {crop.benefits.map((b, j) => (
                            <span key={j} style={{ padding: '3px 10px', background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', color: 'var(--primary-300)' }}>
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTION PLAN */}
            {decision.action_plan && decision.action_plan.length > 0 && (
              <div className="glass-card" style={{ marginBottom: 24, padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>
                    📋 Action Plan
                  </h3>
                  <SpeakerButton
                    text={decision.action_plan.join('. ')}
                    section="action"
                    speakingSection={speakingSection}
                    onSpeak={speakText}
                    onStop={stopSpeaking}
                  />
                </div>
                {decision.action_plan.map((step, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12,
                    padding: '14px 18px', background: 'rgba(10,15,13,0.5)',
                    borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-500)',
                  }}>
                    <div style={{
                      minWidth: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--gradient-accent)', fontWeight: 700, fontSize: '0.82rem', color: '#fff', flexShrink: 0
                    }}>
                      {i + 1}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>{step}</p>
                  </div>
                ))}
              </div>
            )}

            {/* LOCAL LANGUAGE SECTION */}
            {decision.local_language_summary && (
              <div className="glass-card" style={{
                marginBottom: 24, padding: 28,
                background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(10,15,13,0.8))',
                borderColor: 'rgba(14,165,233,0.3)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>
                    🗣️ Summary in Local Language
                  </h3>
                  <SpeakerButton
                    text={decision.local_language_summary}
                    section="localLang"
                    speakingSection={speakingSection}
                    onSpeak={speakText}
                    onStop={stopSpeaking}
                    large
                  />
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  {decision.local_language_summary}
                </p>
              </div>
            )}

            {/* LOCATION INFO */}
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              📍 {result.location?.name} • Analyzed on {new Date().toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse-listening {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(239,68,68,0); }
        }
      `}</style>
    </div>
  );
}

/* ===== Sub-Components ===== */

function ResultCard({ icon, title, children, speakerText, section, speakingSection, onSpeak, onStop }) {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
          {icon} {title}
        </h3>
        {speakerText && (
          <SpeakerButton text={speakerText} section={section} speakingSection={speakingSection} onSpeak={onSpeak} onStop={onStop} />
        )}
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{
      padding: '10px 14px', background: 'rgba(10,15,13,0.5)',
      borderRadius: 'var(--radius-sm)', textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary-300)', fontSize: '1.05rem' }}>
        {value}
      </div>
    </div>
  );
}

function Advisory({ text }) {
  if (!text) return null;
  return (
    <div style={{
      padding: '10px 14px', background: 'rgba(34,197,94,0.06)',
      borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-600)',
      fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6,
    }}>
      💡 {text}
    </div>
  );
}

function SpeakerButton({ text, section, speakingSection, onSpeak, onStop, large = false }) {
  const isSpeaking = speakingSection === section;
  return (
    <button
      className={`btn ${isSpeaking ? 'btn-danger' : 'btn-secondary'}`}
      onClick={() => isSpeaking ? onStop() : onSpeak(text, section)}
      title={isSpeaking ? 'Stop speaking' : 'Listen in your language'}
      style={{
        padding: large ? '10px 20px' : '6px 12px',
        fontSize: large ? '1rem' : '0.85rem',
        borderRadius: 'var(--radius-full)',
        display: 'flex', alignItems: 'center', gap: 6,
        animation: isSpeaking ? 'pulse-glow 1.5s infinite' : 'none',
      }}
    >
      {isSpeaking ? '⏹️ Stop' : `🔊 ${large ? 'Listen' : ''}`}
    </button>
  );
}
