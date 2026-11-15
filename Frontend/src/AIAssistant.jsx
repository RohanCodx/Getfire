import React, { useState, useRef, useEffect } from 'react';

const AIAssistant = ({ selectedFire, fires = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Orbital Copilot initialized. How can I assist with your telemetry analysis?' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const answer = (text) => {
    const q = text.toLowerCase();
    if (fires.length === 0) return 'No detections match the current filters.';

    if (/(largest|highest|biggest|strongest|frp)/.test(q)) {
      const top = [...fires].sort((a, b) => b.frp - a.frp)[0];
      return `Highest FRP in the current view: ${top.frp} MW at ${top.location} (${top.sensor}, ${top.confidence}% confidence).`;
    }
    if (/(how many|count|total)/.test(q)) {
      const m = fires.filter(f => f.sensor.toUpperCase() === 'MODIS').length;
      const v = fires.filter(f => f.sensor.toUpperCase() === 'VIIRS').length;
      return `${fires.length} detections in view: ${m} MODIS, ${v} VIIRS, ${fires.length - m - v} both.`;
    }
    if (/(confiden)/.test(q)) {
      const avg = fires.reduce((s, f) => s + Number(f.confidence), 0) / fires.length;
      return `Average confidence across ${fires.length} detections is ${avg.toFixed(1)}%.`;
    }
    if (selectedFire && selectedFire.sensor) {
      return `Selected: ${selectedFire.location}. Sensor ${selectedFire.sensor}, confidence ${selectedFire.confidence}%, FRP ${selectedFire.frp} MW.`;
    }
    return 'Select a hotspot for details, or ask about the largest fire, detection counts, or average confidence.';
  };

  const handleSend = (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: answer(text) }]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      <button className={`ai-trigger ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)} aria-label="Toggle AI Assistant">
        {isOpen ? '✕' : 'AI'}
      </button>

      <div className={`ai-window ${isOpen ? 'open' : ''}`}>
        <div className="ai-header">
          <div className="ai-title">ORBITAL COPILOT</div>
          <div className="ai-status">LOCAL ANALYSIS</div>
        </div>

        <div className="ai-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-bubble ${msg.role}`}>
              <div className="ai-text">{msg.text}</div>
            </div>
          ))}
          {isTyping && (
            <div className="ai-bubble ai"><div className="ai-text typing">Processing...</div></div>
          )}
          <div ref={endRef} />
        </div>

        <div className="ai-input-area">
          <input
            type="text" placeholder="Query orbital data..." value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          />
          <button onClick={() => handleSend(input)}>Send</button>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
