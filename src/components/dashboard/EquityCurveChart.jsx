import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function EquityCurveChart({ equityData }) {
  if (!equityData || equityData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No equity data available</p>
      </div>
    );
  }



  // Calculate Y-axis domain with 10% padding
  const equityValues = equityData.map(d => d.equity);
  const minEquity = Math.min(...equityValues);
  const maxEquity = Math.max(...equityValues);
  const range = maxEquity - minEquity;
  const padding = range * 0.1 || 10;
  const yDomain = [
    Math.floor(minEquity - padding),
    Math.ceil(maxEquity + padding)
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={equityData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => {
              try {
                return format(new Date(value), 'MMM d');
              } catch {
                return '';
              }
            }}
            stroke="#64748b"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            domain={yDomain}
          />
          <Tooltip 
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Equity']}
            labelFormatter={(value) => {
              try {
                return format(new Date(value), 'MMM d, yyyy');
              } catch {
                return value;
              }
            }}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="equity" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}