import React from 'react';

const AnomalyChart = () => {
  // Hardcoded for demo since backend has "insufficient_history"
  const chartData = [
    { year: '10-Year Avg', val: 3200, color: '#4B5563' },
    { year: '2026 Current', val: 5120, color: '#FF6B35' } 
  ];

  const maxVal = 6000;

  return (
    <div style={{ marginTop: '2rem', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '180px', gap: '20px', borderBottom: '2px solid #374151', paddingBottom: '10px' }}>
        {chartData.map((bar, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <span style={{ fontSize: '0.85rem', color: bar.color, fontWeight: 'bold', marginBottom: '5px' }}>{bar.val.toLocaleString()}</span>
            <div style={{ 
              width: '60%', 
              height: `${(bar.val / maxVal) * 100}%`, 
              backgroundColor: bar.color, 
              borderRadius: '6px 6px 0 0', 
              transition: 'height 1s ease-out',
              boxShadow: bar.color === '#FF6B35' ? '0 0 15px rgba(255, 107, 53, 0.4)' : 'none'
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px', fontSize: '0.85rem', color: '#9CA3AF', fontWeight: 'bold' }}>
        {chartData.map((bar, i) => (
          <span key={i} style={{ color: bar.color }}>{bar.year}</span>
        ))}
      </div>
    </div>
  );
};

export default AnomalyChart;
