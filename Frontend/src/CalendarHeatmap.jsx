import React from 'react';

  // Generate fake intensity values for 365 days
  const days = Array.from({ length: 365 }, () => Math.floor(Math.random() * 100));

const CalendarHeatmap = () => {
  // Fake data for a year's worth of fire activity (0 to 100 intensity)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  

  const getColor = (intensity) => {
    if (intensity > 80) return '#FF6B35'; // Extreme
    if (intensity > 60) return '#FFA07A'; // High
    if (intensity > 40) return '#FFD700'; // Medium
    if (intensity > 20) return '#9D4EDD'; // Low
    return '#1F2937'; // None
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#FFF' }}>Burning Calendar</h3>
      <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', width: '100%' }}>
        {/* Render a simple grid of 365 blocks */}
        {days.map((intensity, i) => (
          <div 
            key={i} 
            title={`Day ${i+1}: ${intensity} Hotspots`}
            style={{ 
              width: '8px', height: '8px', 
              backgroundColor: getColor(intensity),
              borderRadius: '2px'
            }} 
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
        <span>Jan</span><span>Jun</span><span>Dec</span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
