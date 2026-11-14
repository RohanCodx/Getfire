import React from 'react';

const AnomalyChart = () => {
  const chartData = [
    { label: '10-YR AVG', value: 3200, color: '#3F3F46' },
    { label: 'CURRENT', value: 5120, color: '#EF4444' } 
  ];
  
  const maxVal = 6000;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4rem', height: '180px', borderBottom: '1px solid #3F3F46', paddingBottom: '16px' }}>
        {chartData.map((bar, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', width: '70px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 'bold', color: '#FAFAFA', marginBottom: '12px' }}>
              {bar.value.toLocaleString()}
            </span>
            <div style={{ 
              width: '100%', 
              height: `${(bar.value / maxVal) * 100}%`, 
              backgroundColor: bar.color, 
              borderRadius: '4px 4px 0 0',
              transition: 'height 1s ease-out'
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginTop: '16px' }}>
        {chartData.map((bar, i) => (
          <span key={i} style={{ width: '70px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px', color: '#A1A1AA' }}>
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AnomalyChart;
