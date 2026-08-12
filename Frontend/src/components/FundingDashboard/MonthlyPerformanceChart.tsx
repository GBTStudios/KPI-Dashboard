import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyTrendPoint } from '../../types/fundingDashboard';

interface MonthlyPerformanceChartProps {
  data: MonthlyTrendPoint[];
}

export default function MonthlyPerformanceChart({ data }: MonthlyPerformanceChartProps) {
  return (
    <div className="funding-chart-card">
      <div className="funding-chart-header">
        <div>
          <div className="funding-chart-title">Monthly Performance Trend</div>
          <div className="funding-chart-subtitle">Actual performance vs target performance (%)</div>
        </div>
        <div className="funding-chart-legend">
          <span className="legend-item">
            <span className="legend-dash" /> Actual Performance (%)
          </span>
          <span className="legend-item">
            <span className="legend-dot" /> Target Performance (%)
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="targetFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c5e59" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#1c5e59" stopOpacity={0} />
            </linearGradient>
          </defs>
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

          <Area
            type="monotone"
            dataKey="target"
            stroke="none"
            fill="url(#targetFill)"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#1c5e59"
            strokeWidth={2.5}
            dot={false}
            name="Target Performance (%)"
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#22c55e"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            name="Actual Performance (%)"
          />

          <Legend wrapperStyle={{ display: 'none' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}