'use client';
import { useState, useEffect, useRef } from 'react';

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your AI farming assistant. Click the microphone and ask me anything in your native language!' }
  ]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.lang = navigator.language || 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        handleUserSpeech(transcript, recognition.lang);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleUserSpeech = async (text, lang) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    setMessages(prev => [...prev, { role: 'assistant', text: 'Thinking...', loading: true }]);

    try {
      const res = await fetch('http://localhost:8000/api/ai/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang })
      });
      const data = await res.json();
      
      const reply = data.response || "Sorry, I couldn't understand that.";
      
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop();
        return [...newMsgs, { role: 'assistant', text: reply }];
      });

      speakOut(reply, lang);
    } catch (e) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop();
        return [...newMsgs, { role: 'assistant', text: 'Error connecting to the AI.' }];
      });
    }
  };

  const speakOut = (text, lang) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try { recognitionRef.current?.start(); } catch (e) { console.error("Speech Rec Error", e) }
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        className={`voice-fab ${isListening ? 'listening-pulse' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="AI Voice Assistant"
      >
        🎙️
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="voice-window glass-card">
          <div className="voice-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: 12, marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>🤖 AI Assistant</h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
          
          <div className="voice-messages" style={{ height: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 8 }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ padding: '10px 14px', borderRadius: '18px', maxWidth: '85%', fontSize: '0.9rem', lineHeight: 1.4, 
                backgroundColor: msg.role === 'user' ? 'var(--primary-600)' : 'rgba(255,255,255,0.1)',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                borderBottomRightRadius: msg.role === 'user' ? 4 : 18,
                borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 18
              }}>
                {msg.loading ? <span className="typing-dots">...</span> : msg.text}
              </div>
            ))}
          </div>

          <div className="voice-controls" style={{ marginTop: 16, textAlign: 'center' }}>
            <button 
              onClick={toggleListening}
              style={{
                background: isListening ? 'var(--danger-500)' : 'var(--primary-500)',
                color: 'white', padding: '12px 24px', borderRadius: 30, border: 'none',
                cursor: 'pointer', fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center', margin: '0 auto', transition: 'all 0.3s'
              }}
            >
              {isListening ? '🛑 Stop Listening' : '🎙️ Tap to Speak'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
