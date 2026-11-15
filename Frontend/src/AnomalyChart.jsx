import React from 'react';

const AnomalyChart = ({ current = 0, baseline = 3200, baselineLabel = 'BASELINE (SAMPLE)' }) => {
  const chartData = [
    { label: baselineLabel, value: baseline, color: '#3F3F46' },
    { label: 'CURRENT', value: current, color: current > baseline ? '#EF4444' : '#10B981' },
  ];
  const maxVal = Math.max(current, baseline, 1) * 1.2;
  const diff = baseline > 0 ? Math.round(((current - baseline) / baseline) * 100) : 0;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '5rem', height: '220px', borderBottom: '1px solid #3F3F46', paddingBottom: '16px' }}>
        {chartData.map((bar, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', width: '80px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.1rem', fontWeight: 'bold', color: '#FAFAFA', marginBottom: '12px' }}>
              {bar.value.toLocaleString()}
            </span>
            <div style={{ width: '100%', height: `${(bar.value / maxVal) * 80}%`, backgroundColor: bar.color, borderRadius: '4px 4px 0 0', transition: 'height 1s ease-out' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '5rem', marginTop: '16px' }}>
        {chartData.map((bar, i) => (
          <span key={i} style={{ width: '80px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px', color: '#A1A1AA' }}>
            {bar.label}
          </span>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: '#A1A1AA' }}>
        {diff >= 0 ? '+' : ''}{diff}% vs baseline
      </div>
    </div>
  );
};

export default AnomalyChart;
