
// Renders the "Map Performance" card: a bar chart (Actual MAP)
// with a dotted line overlay (Target MAP).
//
// We use Recharts' <ComposedChart>, which lets you mix
// different chart types (Bar + Line) that share the same
// x-axis and data — exactly what the design needs.

import { Activity } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MapPerformancePoint } from '../../types/dashboard';

interface MapPerformanceChartProps {
  data: MapPerformancePoint[];
}

export default function MapPerformanceChart({ data }: MapPerformanceChartProps) {
  return (
    <div className="chart-card">
      <div className="chart-card-title">
        <Activity size={18} color="#5575f2" />
        Map Performance
      </div>
      <div className="chart-card-subtitle">
        Comparison between target metrics and actual performance
      </div>

      {/* ResponsiveContainer makes the chart resize with its parent card,
          instead of having a fixed pixel width. */}
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#eef0f2" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <Tooltip />
          <Legend
            verticalAlign="bottom"
            align="left"
            iconType="circle"
            formatter={(value) => (value === 'actual' ? 'Actual MAP' : 'Target MAP')}
          />

          {/* The solid bars — "actual" comes from our MapPerformancePoint type */}
          <Bar dataKey="actual" fill="#1c5e59" radius={[4, 4, 0, 0]} barSize={32} name="actual" />

          {/* The dotted target line — strokeDasharray is what makes it dotted */}
          <Line
            type="monotone"
            dataKey="target"
            stroke="#5575f2"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 4, fill: '#5575f2' }}
            name="target"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}