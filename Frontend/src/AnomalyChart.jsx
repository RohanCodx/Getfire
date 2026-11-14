import React from 'react';

const AnomalyChart = () => {
  const chartData = [
    { label: '10-YR AVG', value: 3200, color: '#374151', text: '#9CA3AF' },
    { label: 'CURRENT', value: 5120, color: '#FF4B4B', text: '#FF4B4B' } 
  ];
  
  // Max value for scaling the height (6000)
  const maxVal = 6000;

  return (
    <div style={{ width: '100%', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginTop: '2rem' }}>
      
      {/* Bars Container */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4rem', height: '180px', borderBottom: '2px solid #1F2937', paddingBottom: '10px' }}>
        {chartData.map((bar, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', width: '80px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 'bold', color: bar.text, marginBottom: '10px' }}>
              {bar.value.toLocaleString()}
            </span>
            <div style={{ 
              width: '100%', 
              height: `${(bar.value / maxVal) * 100}%`, 
              backgroundColor: bar.color, 
              borderRadius: '6px 6px 0 0',
              boxShadow: i === 1 ? '0 0 20px rgba(255, 75, 75, 0.4)' : 'none',
              transition: 'height 1s ease-out'
            }} />
          </div>
        ))}
      </div>

      {/* Labels Container */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginTop: '15px' }}>
        {chartData.map((bar, i) => (
          <span key={i} style={{ width: '80px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px', color: bar.text }}>
            {bar.label}
          </span>
        ))}
      </div>

    </div>
  );
};

export default AnomalyChart;
