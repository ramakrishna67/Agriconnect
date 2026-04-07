'use client';
import { useState, useRef } from 'react';

export default function DiseaseDetectPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch('/api/disease/detect', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setResult(data);
          // Track scan count in localStorage
          const prev = parseInt(localStorage.getItem('scan_count') || '0', 10);
          localStorage.setItem('scan_count', String(prev + 1));
          // Save scan history for dashboard
          try {
            const history = JSON.parse(localStorage.getItem('scan_history') || '[]');
            history.unshift({
              disease: data.disease,
              confidence: data.confidence,
              crop: data.crop,
              model: data.model_info?.model || 'Unknown',
              time: new Date().toISOString(),
            });
            localStorage.setItem('scan_history', JSON.stringify(history.slice(0, 20)));
          } catch {}
        }
      } else {
        setError('Backend returned an error. Make sure the backend server is running.');
      }
    } catch (e) {
      setError('Could not connect to the backend. Please ensure python main.py is running on port 8000.');
    }
    setLoading(false);
  };


  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <h1>🔬 Crop Disease Detection</h1>
          {/* <p>Upload a photo of your crop for instant AI-powered disease diagnosis using our CNN model</p> */}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
          <div className="glass-card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>📸 Upload Crop Image</h3>
            <div
              style={{ border: `2px dashed ${dragActive ? 'var(--primary-500)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-lg)', padding: preview ? 12 : 48, textAlign: 'center', cursor: 'pointer', background: dragActive ? 'rgba(34,197,94,0.05)' : 'rgba(10,15,13,0.4)', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s' }}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileSelect(e.dataTransfer.files[0]); }}
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Crop" style={{ maxWidth: '100%', maxHeight: 350, borderRadius: 'var(--radius-md)', objectFit: 'contain' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: '3rem' }}>📷</div>
                  <p style={{ fontWeight: 600 }}>Drag & drop your crop image here</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>or click to browse</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files[0])} style={{ display: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleAnalyze} disabled={!selectedFile || loading}>
                {loading ? '⟳ Analyzing...' : '🔬 Analyze with CNN'}
              </button>
              {selectedFile && <button className="btn btn-secondary" onClick={() => { setSelectedFile(null); setPreview(null); setResult(null); }}>Reset</button>}
            </div>
            {/* <div style={{ marginTop: 20, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <div>● Model: CNN (MobileNetV2 Transfer Learning)</div>
              <div style={{ marginTop: 4 }}>● Dataset: PlantVillage (16 classes)</div>
              <div style={{ marginTop: 4 }}>● Crops: Tomato, Potato, Pepper (Bell)</div>
            </div> */}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {!result && !loading && !error && (
              <div className="glass-card" style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="empty-state"><div className="empty-icon">🌿</div><h3>No Analysis Yet</h3><p>Upload a crop image to get started</p></div>
              </div>
            )}
            {loading && <div className="glass-card"><div className="loading-overlay"><div className="spinner"></div><p>Running AI analysis (CNN first, Gemini fallback)...</p></div></div>}
            {error && !loading && (
              <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
                <h3 style={{ color: 'var(--danger-500)', marginBottom: 8 }}>Analysis Failed</h3>
                <p style={{ color: 'var(--text-muted)' }}>{error}</p>
              </div>
            )}
            {result && (
              <>
                <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>🌱 {result.crop}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{result.disease}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--primary-400)' }}>{result.confidence}%</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <span className={`badge ${result.severity === 'High' ? 'badge-danger' : result.severity === 'Medium' ? 'badge-warning' : 'badge-success'}`}>Severity: {result.severity}</span>
                    {/* <span className="badge badge-info">Model: {result.model_info.model}</span> */}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.7 }}>{result.description}</p>
                </div>
                <div className="glass-card">
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 14 }}>⚠️ Symptoms</h3>
                  {result.symptoms.map((s, i) => <div key={i} style={{ padding: '10px 14px', background: 'rgba(10,15,13,0.4)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary-500)', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{s}</div>)}
                </div>
                <div className="glass-card">
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 14 }}>💊 Treatment</h3>
                  {result.treatment.map((t, i) => <div key={i} style={{ padding: '10px 14px', background: 'rgba(10,15,13,0.4)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-500)', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{(i+1)}. {t}</div>)}
                </div>
                <div className="glass-card">
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 14 }}>🛡️ Prevention</h3>
                  {result.prevention.map((p, i) => <div key={i} style={{ padding: '10px 14px', background: 'rgba(10,15,13,0.4)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--sky-500)', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{p}</div>)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
