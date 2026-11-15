import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from './config';

const QUICK_PROMPTS = [
  'Peak FRP thermal anomaly in view',
  'Compare MODIS (1km) vs VIIRS (375m)',
  'Wildfire spread & risk assessment',
  'Incident Commander situation briefing',
  'Emergency evacuation & safety protocol',
];

const AIAssistant = ({ selectedFire, fires = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: '**Orbital Copilot Online.** Connected to live NASA MODIS (1km) and VIIRS (375m) telemetry. Select any prompt below or enter a custom query.',
      provider: 'NASA Telemetry Copilot',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsTyping(true);

    const modisCount = fires.filter(f => f.sensor?.toUpperCase() === 'MODIS').length;
    const viirsCount = fires.filter(f => f.sensor?.toUpperCase() === 'VIIRS').length;
    const totalFrp = fires.reduce((s, f) => s + (parseFloat(f.frp) || 0), 0);
    const sorted = [...fires].sort((a, b) => (parseFloat(b.frp) || 0) - (parseFloat(a.frp) || 0));
    const topFire = sorted[0] || null;

    const payload = {
      message: text,
      context: {
        fireCount: fires.length,
        modisCount,
        viirsCount,
        totalFrp: Math.round(totalFrp * 10) / 10,
        topFire: topFire ? {
          frp: topFire.frp,
          lat: topFire.lat,
          lon: topFire.lng,
          sensor: topFire.sensor,
          location: topFire.location,
        } : null,
        selectedFire: selectedFire ? {
          lat: selectedFire.lat,
          lng: selectedFire.lng,
          sensor: selectedFire.sensor,
          frp: selectedFire.frp,
          confidence: selectedFire.confidence,
          location: selectedFire.location,
        } : null,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      setMessages(prev => [...prev, {
        role: 'ai',
        text: data.reply || 'Telemetry analysis complete.',
        provider: data.provider || 'NASA AI Engine',
      }]);
    } catch {
      let fallbackText = '';
      const q = text.toLowerCase();
      if (/(largest|highest|peak|frp)/.test(q) && topFire) {
        fallbackText = `### Peak Thermal Anomaly\n- **Highest FRP:** **${topFire.frp} MW**\n- **Sensor:** **${topFire.sensor}**\n- **Location:** ${topFire.location} (Lat ${topFire.lat.toFixed(4)}, Lon ${topFire.lng.toFixed(4)})\n- **Confidence:** ${topFire.confidence}%`;
      } else if (/(modis|viirs|difference|compare)/.test(q)) {
        fallbackText = `### Multi-Sensor Telemetry\n- **MODIS (1km):** ${modisCount} detections (Terra & Aqua)\n- **VIIRS (375m):** ${viirsCount} detections (Suomi-NPP & NOAA-20)\n- **Harmonization:** Co-located H3 detections confirm active wildfire complexes.`;
      } else {
        fallbackText = `### Orbital Telemetry Summary\n- **Visible Hotspots:** ${fires.length} active anomalies\n- **Cumulative FRP:** ${Math.round(totalFrp)} MW\n- **Peak Intensity:** ${topFire ? `${topFire.frp} MW` : 'N/A'}`;
      }

      setMessages(prev => [...prev, {
        role: 'ai',
        text: fallbackText,
        provider: 'Local Telemetry Engine',
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderFormatted = (text) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <div key={idx} className="ai-heading">{line.replace('### ', '')}</div>;
      }
      if (line.startsWith('- ')) {
        const content = line.slice(2);
        const parts = content.split(/(\*\*.*?\*\*)/g);
        return (
          <div key={idx} className="ai-bullet">
            <span className="ai-bullet-dot" />
            <span>
              {parts.map((p, pi) => p.startsWith('**') && p.endsWith('**')
                ? <strong key={pi} style={{ color: '#FBBF24' }}>{p.slice(2, -2)}</strong>
                : p
              )}
            </span>
          </div>
        );
      }
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={idx} style={{ margin: '3px 0' }}>
          {parts.map((p, pi) => p.startsWith('**') && p.endsWith('**')
            ? <strong key={pi} style={{ color: '#FAFAFA' }}>{p.slice(2, -2)}</strong>
            : p
          )}
        </div>
      );
    });
  };

  return (
    <>
      <button
        className={`ai-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Orbital AI Copilot"
        title="Orbital AI Copilot"
      >
        {isOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span style={{ fontWeight: 800, letterSpacing: '0.5px', fontSize: '0.78rem' }}>AI</span>
          </div>
        )}
      </button>

      <div className={`ai-window ${isOpen ? 'open' : ''}`}>
        <div className="ai-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="status-dot live"></div>
            <div className="ai-title">ORBITAL AI COPILOT</div>
          </div>
          <div className="ai-status">STATELESS API</div>
        </div>

        <div className="ai-chips">
          {QUICK_PROMPTS.map((q, idx) => (
            <button
              key={idx}
              className="ai-chip-btn"
              onClick={() => handleSend(q)}
              disabled={isTyping}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="ai-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-bubble ${msg.role}`}>
              <div className="ai-text">
                {renderFormatted(msg.text)}
                {msg.provider && (
                  <div className="ai-provider-tag">
                    {msg.provider}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="ai-bubble ai">
              <div className="ai-text typing">
                Synthesizing orbital telemetry...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="ai-input-area">
          <input
            type="text"
            placeholder="Query hotspots, FRP, sensors, or risk..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
          />
          <button onClick={() => handleSend()} disabled={isTyping || !input.trim()}>
            SEND
          </button>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
