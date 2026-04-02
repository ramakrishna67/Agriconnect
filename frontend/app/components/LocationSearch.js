'use client';
import { useState, useEffect, useRef } from 'react';

export default function LocationSearch({ onLocationSelect, defaultLocation = "Delhi" }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [resolveStatus, setResolveStatus] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced autocomplete fetch from Open-Meteo geocoding
  useEffect(() => {
    const fetchLocations = async () => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (e) {
        console.error("Geocoding autocomplete failed", e);
        setResults([]);
      }
      setLoading(false);
    };

    const timeoutId = setTimeout(fetchLocations, 400);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (loc) => {
    const fullName = `${loc.name}${loc.admin1 ? `, ${loc.admin1}` : ''}, ${loc.country}`;
    setQuery(fullName);
    setShowDropdown(false);
    setResolveStatus('');
    onLocationSelect({ name: loc.name, fullName, lat: loc.latitude, lon: loc.longitude });
  };

  // Resolve typed place name via Open-Meteo first, then Gemini fallback
  const resolveByName = async (placeName) => {
    if (!placeName.trim()) return;
    setResolving(true);
    setShowDropdown(false);
    setResolveStatus('Searching...');

    // 1. Try Open-Meteo geocoding
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(placeName)}&count=1&language=en&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const loc = data.results[0];
          const fullName = `${loc.name}${loc.admin1 ? `, ${loc.admin1}` : ''}, ${loc.country}`;
          setQuery(fullName);
          setResolveStatus('Found ✓');
          setResolving(false);
          onLocationSelect({ name: loc.name, fullName, lat: loc.latitude, lon: loc.longitude });
          return;
        }
      }
    } catch (e) {
      console.warn("Open-Meteo failed, trying Gemini...");
    }

    // 2. Fallback: Gemini AI to resolve coordinates
    setResolveStatus('Using AI to locate...');
    try {
      const res = await fetch('/api/ai/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: placeName })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.lat && data.lon) {
          setQuery(data.fullName || placeName);
          setResolveStatus('Located via AI ✓');
          setResolving(false);
          onLocationSelect({ name: data.name || placeName, fullName: data.fullName || placeName, lat: data.lat, lon: data.lon });
          return;
        }
      }
    } catch (e) {
      console.error("Gemini geocode also failed", e);
    }

    setResolveStatus('⚠️ Location not found. Try a different name.');
    setResolving(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If dropdown has results, pick the first one
      if (results.length > 0) {
        handleSelect(results[0]);
      } else {
        // Otherwise resolve the typed name directly
        resolveByName(query);
      }
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: '560px', marginBottom: '32px' }}>
      <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="form-control"
            placeholder={`Type any city, village, or rural area worldwide (e.g., ${defaultLocation})`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
              setResolveStatus('');
            }}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            onKeyDown={handleKeyDown}
            style={{ width: '100%', paddingLeft: '40px', paddingRight: '12px' }}
          />
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', pointerEvents: 'none' }}>
            📍
          </span>
          {(loading || resolving) && (
            <div className="spinner" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', borderWidth: '2px' }}></div>
          )}
        </div>
        <button
          onClick={() => resolveByName(query)}
          className="btn btn-primary"
          disabled={!query.trim() || resolving}
          style={{ whiteSpace: 'nowrap', paddingLeft: 20, paddingRight: 20 }}
        >
          {resolving ? '⟳' : '🔍 Search'}
        </button>
      </div>

      {resolveStatus && (
        <div style={{
          marginTop: 8,
          fontSize: '0.85rem',
          color: resolveStatus.startsWith('⚠️') ? 'var(--danger-400)' : 'var(--primary-400)',
          paddingLeft: 4
        }}>
          {resolveStatus}
        </div>
      )}

      {showDropdown && results.length > 0 && (
        <div className="glass-card" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          zIndex: 1000,
          padding: '8px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '4px 16px 8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Suggestions — or press Enter to use first result
          </div>
          {results.map((loc) => (
            <div
              key={loc.id}
              onClick={() => handleSelect(loc)}
              style={{ padding: '12px 16px', cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '12px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: '1.2rem' }}>📍</div>
              <div>
                <div style={{ fontWeight: 600 }}>{loc.name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {[loc.admin1, loc.admin2, loc.country].filter(Boolean).join(', ')}
                  <span style={{ color: 'var(--text-muted)', opacity: 0.6, marginLeft: 8 }}>{loc.latitude?.toFixed(2)}°N {loc.longitude?.toFixed(2)}°E</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDropdown && query.length >= 2 && !loading && !resolving && results.length === 0 && (
        <div className="glass-card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', zIndex: 1000, padding: '16px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>No autocomplete results — press Enter or click Search to use AI geocoding</div>
        </div>
      )}
    </div>
  );
}
