import React from 'react';
import type { TooltipContentProps } from 'recharts';

/**
 * Custom tooltip for Recharts charts.
 * Displays the label (typically the X‑axis value) and each data entry
 * with a colored marker matching the chart series.
 * The component is styled with a semi‑transparent dark background,
 * subtle backdrop blur and smooth rounded corners to match the overall
 * premium UI aesthetic of the application.
 */
const CustomTooltip = ({ active, payload, label, labelFormatter }: TooltipContentProps<number, string> & { labelFormatter?: (val: any) => string }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  const bgColor = 'rgba(20, 20, 30, 0.92)';
  const displayLabel = labelFormatter ? labelFormatter(label) : label;

  return (
    <div
      style={{
        background: bgColor,
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(4px)',
        minWidth: '120px',
      }}
    >
      <div style={{ marginBottom: '4px', fontSize: '0.85rem', opacity: 0.8 }}>{displayLabel}</div>
      {payload.map((entry, index) => (
        <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: entry.stroke ?? entry.color,
            }}
          />
          <span>{entry.name}: </span>
          <span style={{ fontWeight: 600 }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default CustomTooltip;
