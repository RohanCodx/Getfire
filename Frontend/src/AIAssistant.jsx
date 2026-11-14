import React, { useState } from 'react';

const AIAssistant = ({ selectedFire }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Orbital Copilot initialized. Systems nominal. How can I assist with your telemetry analysis?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    
    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = "Analyzing satellite data... ";
      if (text.toLowerCase().includes('largest')) {
        reply += "The highest Fire Radiative Power (FRP) detected is in the Amazon Basin at 45.1 MW.";
      } else if (selectedFire) {
        reply += `Regarding the selected anomaly in ${selectedFire.location}, confidence is at ${selectedFire.confidence}%. Recommend immediate cross-referencing with MODIS historical data.`;
      } else {
        reply += "Please select a hotspot on the map for localized analysis, or ask me about global sensor anomalies.";
      }
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      <div className={`ai-hologram-trigger ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        <div className="ai-ring-outer"></div>
        <div className="ai-ring-inner"></div>
        <div className="ai-core">AI</div>
      </div>

      <div className={`ai-hud-window ${isOpen ? 'open' : ''}`}>
        <div className="ai-hud-header">
          <div className="ai-hud-title">ORBITAL COPILOT</div>
          <div className="ai-hud-status">LINK ACTIVE</div>
        </div>

        <div className="ai-hud-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-hud-bubble ${msg.role}`}>
              <div className="ai-hud-text">{msg.text}</div>
            </div>
          ))}
          {isTyping && (
            <div className="ai-hud-bubble ai">
              <div className="ai-hud-text typing">Processing...</div>
            </div>
          )}
        </div>

        <div className="ai-hud-input">
          <input 
            type="text" 
            placeholder="Query orbital data..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          />
          <button onClick={() => handleSend(input)}>SEND</button>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
