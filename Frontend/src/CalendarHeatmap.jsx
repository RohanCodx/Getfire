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
    if (intensity > 0)  return '#1F2937'; 
    return '#111827';                     
  };

  return (
    <div style={{ marginTop: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateRows: 'repeat(7, 10px)', // Tighter squares
        gridAutoFlow: 'column', 
        gridAutoColumns: '10px', 
        gap: '3px' 
      }}>
        {calendarData.map((intensity, i) => (
          <div key={i} title={`Activity: ${intensity}`} style={{ backgroundColor: getColor(intensity), borderRadius: '2px' }} />
        ))}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '0.65rem', color: '#6B7280', fontWeight: '700', letterSpacing: '1px' }}>
        <span>JAN</span><span>APR</span><span>JUL</span><span>OCT</span><span>DEC</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '20px', fontSize: '0.65rem', color: '#6B7280', fontWeight: '600' }}>
        <span>Low Activity</span>
        <div style={{ width: '10px', height: '10px', backgroundColor: '#111827', borderRadius: '2px' }}></div>
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
