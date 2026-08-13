// ============================================================
// Sparkline.tsx
// ------------------------------------------------------------
// A tiny trend line — no axes, no grid, no tooltip. Recharts is
// already an installed dependency (used by the main dashboard
// charts), so this reuses it rather than adding a new library.
// ============================================================

import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { ParameterRowStatus } from '../../types/departmentParameter';

interface SparklineProps {
  values: number[];
  status: ParameterRowStatus;
}

const STATUS_COLORS: Record<ParameterRowStatus, string> = {
  'on-target': '#22c55e',
  'near-target': '#e0a83e',
  'below-target': '#d9534f',
};

export default function Sparkline({ values, status }: SparklineProps) {
  const data = values.map((value, index) => ({ index, value }));

  return (
    <div className="sparkline-wrap">
      <ResponsiveContainer width="100%" height={32}>
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={STATUS_COLORS[status]}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}