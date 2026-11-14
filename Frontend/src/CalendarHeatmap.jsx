import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from './config';

const DAYS = 365;
const COLS = Math.ceil(DAYS / 7);
const fmt = (d) => d.toISOString().slice(0, 10);

const CalendarHeatmap = () => {
  const [counts, setCounts] = useState(() => Array(DAYS).fill(0));
  const [hasData, setHasData] = useState(false);

  const dates = useMemo(() => {
    const end = new Date();
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(end);
      d.setDate(end.getDate() - (DAYS - 1 - i));
      return d;
    });
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/calendar?west=-180&south=-90&east=180&north=90&start_date=${fmt(dates[0])}&end_date=${fmt(dates[DAYS - 1])}`)
      .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(data => {
        const arr = data.days || data;
        if (!Array.isArray(arr) || arr.length === 0) return;
        const next = Array(DAYS).fill(0);
        const indexByDate = new Map(dates.map((d, i) => [fmt(d), i]));
        arr.forEach((item, idx) => {
          const count = typeof item === 'number' ? item : (item.hotspot_count || 0);
          const dateKey = item && item.date ? String(item.date).slice(0, 10) : null;
          const pos = dateKey && indexByDate.has(dateKey) ? indexByDate.get(dateKey) : DAYS - arr.length + idx;
          if (pos >= 0 && pos < DAYS) next[pos] = count;
        });
        setCounts(next);
        setHasData(true);
      })
      .catch(() => console.warn('Calendar data unavailable.'));
  }, [dates]);

  const max = Math.max(...counts, 1);

  const getColor = (count) => {
    const p = (count / max) * 100;
    if (count === 0) return '#18181B';
    if (p > 80) return '#FDE047';
    if (p > 60) return '#F97316';
    if (p > 40) return '#C026D3';
    if (p > 20) return '#581C87';
    return '#27272A';
  };

  // month labels positioned at the first column of each new month
  const monthLabels = [];
  let lastMonth = -1;
  for (let c = 0; c < COLS; c++) {
    const d = dates[c * 7];
    if (d && d.getMonth() !== lastMonth) {
      monthLabels.push({ c, label: d.toLocaleString('en', { month: 'short' }).toUpperCase() });
      lastMonth = d.getMonth();
    }
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: 'repeat(7, 1fr)',
        gridAutoFlow: 'column', gap: '4px', width: '100%', height: '110px', marginBottom: '0.5rem',
      }}>
        {counts.map((count, i) => (
          <div
            key={i}
            title={`${fmt(dates[i])}: ${count.toLocaleString()} hotspots`}
            style={{ backgroundColor: getColor(count), borderRadius: '2px', aspectRatio: '1' }}
          />
        ))}
      </div>

      <div style={{ position: 'relative', height: '16px', width: '100%', fontSize: '0.7rem', color: '#A1A1AA', fontWeight: 600 }}>
        {monthLabels.map(m => (
          <span key={m.c} style={{ position: 'absolute', left: `${(m.c / COLS) * 100}%` }}>{m.label}</span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '1rem', fontSize: '0.7rem', color: '#A1A1AA' }}>
        <span>{hasData ? '' : 'No data – backend offline'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Low</span>
          {['#18181B', '#581C87', '#C026D3', '#F97316', '#FDE047'].map(c => (
            <div key={c} style={{ width: '12px', height: '12px', backgroundColor: c, borderRadius: '2px' }} />
          ))}
          <span>High</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
