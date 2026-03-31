import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { parseMarginRows, getMetricKeys } from '../../utils/chartParsers';

const LINE_COLOURS = ['#00d9ff', '#5cff9d', '#ffd166', '#ff6b6b'];

const AXIS_STYLE = {
  fill: '#9fdcf5',
  fontSize: 12,
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color, margin: '0.2rem 0' }}>
          {entry.name}: <strong>{entry.value.toFixed(1)}%</strong>
        </p>
      ))}
    </div>
  );
}

export default function MarginTrendChart({ table }) {
  const data = parseMarginRows(table);
  if (!data || data.length < 2) return null;

  const keys = getMetricKeys(data);
  const marginKeys = keys.filter((k) => /margin/i.test(k)).slice(0, 3);
  const displayKeys = marginKeys.length > 0 ? marginKeys : keys.slice(0, 3);

  return (
    <div className="chart-container">
      <p className="chart-title">Margin Trends (%)</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(130,229,255,0.1)" vertical={false} />
          <XAxis dataKey="period" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis
            tick={AXIS_STYLE}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(130,229,255,0.2)' }} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#9fdcf5', paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          {displayKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={LINE_COLOURS[i % LINE_COLOURS.length]}
              strokeWidth={2}
              dot={{ r: 4, fill: LINE_COLOURS[i % LINE_COLOURS.length], strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}