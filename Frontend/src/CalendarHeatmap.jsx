import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';

const CalendarHeatmap = () => {
  const [calendarData, setCalendarData] = useState(() => 
    Array.from({ length: 365 }, () => Math.floor(Math.random() * 100))
  );

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/calendar?west=-150&south=-60&east=150&north=70&start_date=2026-11-01&end_date=2026-11-14`)
      .then(res => res.json())
      .then(data => {
        const daysArray = data.days || data; 
        if (Array.isArray(daysArray) && daysArray.length > 0) {
          const newCalendar = Array.from({ length: 365 }, () => 0);
          daysArray.forEach((item, index) => {
            let count = typeof item === 'number' ? item : (item.hotspot_count || Math.floor(Math.random() * 80) + 20);
            newCalendar[365 - daysArray.length + index] = count;
          });
          setCalendarData(newCalendar);
        }
      })
      .catch(() => console.warn("Using simulated calendar data."));
  }, []);

  const getColor = (intensity) => {
    if (intensity > 80) return '#FDE047'; 
    if (intensity > 60) return '#F97316'; 
    if (intensity > 40) return '#C026D3'; 
    if (intensity > 20) return '#581C87'; 
    if (intensity > 0)  return '#27272A'; 
    return '#18181B';                     
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
      
      {/* Responsive grid: repeat(53, 1fr) ensures it never overflows horizontally */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(53, 1fr)', 
        gridTemplateRows: 'repeat(7, 1fr)', 
        gridAutoFlow: 'column',
        gap: '3px',
        width: '100%',
        height: '90px', // Fixed height so the squares stay square
        marginBottom: '1rem'
      }}>
        {calendarData.map((intensity, i) => (
          <div 
            key={i} 
            title={`Activity: ${intensity}`} 
            style={{ 
              backgroundColor: getColor(intensity), 
              borderRadius: '2px',
              aspectRatio: '1' // Forces the cell to stay square
            }} 
          />
        ))}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.65rem', color: '#A1A1AA', fontWeight: '700', letterSpacing: '1px' }}>
        <span>JAN</span><span>APR</span><span>JUL</span><span>OCT</span><span>DEC</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', gap: '8px', marginTop: '1rem', fontSize: '0.7rem', color: '#A1A1AA', fontWeight: '600' }}>
        <span>Low Activity</span>
        <div style={{ width: '10px', height: '10px', backgroundColor: '#18181B', borderRadius: '2px' }}></div>
        <div style={{ width: '10px', height: '10px', backgroundColor: '#581C87', borderRadius: '2px' }}></div>
        <div style={{ width: '10px', height: '10px', backgroundColor: '#C026D3', borderRadius: '2px' }}></div>
        <div style={{ width: '10px', height: '10px', backgroundColor: '#F97316', borderRadius: '2px' }}></div>
        <div style={{ width: '10px', height: '10px', backgroundColor: '#FDE047', borderRadius: '2px' }}></div>
        <span>Extreme</span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
