import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { parseValuationMultiples, getValuationKeys } from '../../utils/chartParsers';

const SUBJECT_COLOUR = '#00d9ff';
const PEER_COLOURS = ['#4a8fa8', '#2e6a82', '#1e5066', '#164059'];

const AXIS_STYLE = {
  fill: '#9fdcf5',
  fontSize: 12,
};

const INCLUDED_METRICS = ['P/E', 'P/E (TTM)', 'Forward P/E', 'EV/EBITDA', 'P/S', 'P/S (TTM)', 'P/B'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color || SUBJECT_COLOUR, margin: '0.2rem 0' }}>
          {entry.name}: <strong>{entry.value.toFixed(1)}x</strong>
        </p>
      ))}
    </div>
  );
}

export default function ValuationMultiplesChart({ table }) {
  const allData = parseValuationMultiples(table);
  if (!allData || allData.length === 0) return null;

  const keys = getValuationKeys(table);
  if (keys.length === 0) return null;

  const data = allData.filter((row) =>
    INCLUDED_METRICS.some((m) => row.metric.includes(m.split(' ')[0]))
  );
  if (data.length === 0) return null;

  return (
    <div className="chart-container">
      <p className="chart-title">Valuation Multiples vs Peers</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={3} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(130,229,255,0.1)" vertical={false} />
          <XAxis dataKey="metric" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis
            tick={AXIS_STYLE}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => `${v}x`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(130,229,255,0.06)' }} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#9fdcf5', paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          {keys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={i === 0 ? SUBJECT_COLOUR : PEER_COLOURS[(i - 1) % PEER_COLOURS.length]}
              radius={[3, 3, 0, 0]}
              fillOpacity={i === 0 ? 0.92 : 0.65}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}