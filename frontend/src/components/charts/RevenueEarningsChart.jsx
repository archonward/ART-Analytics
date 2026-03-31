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
import { parseIncomeStatementRows, getMetricKeys } from '../../utils/chartParsers';

const BAR_COLOURS = ['#00d9ff', '#1e8fb0', '#5cff9d', '#ffd166'];

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
          {entry.name}: <strong>{entry.value.toFixed(1)}</strong>
        </p>
      ))}
    </div>
  );
}

export default function RevenueEarningsChart({ table }) {
  const data = parseIncomeStatementRows(table);
  if (!data || data.length < 2) return null;

  const keys = getMetricKeys(data);
  const preferredOrder = [
    'Revenue', 'Gross Profit', 'Operating Income', 'Net Income',
    'Total Revenue', 'Net Revenue',
  ];
  const displayKeys = [
    ...preferredOrder.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !preferredOrder.includes(k)),
  ].slice(0, 4);

  return (
    <div className="chart-container">
      <p className="chart-title">Revenue &amp; Earnings ($B)</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={4} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(130,229,255,0.1)" vertical={false} />
          <XAxis dataKey="period" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={45} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(130,229,255,0.06)' }} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#9fdcf5', paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          {displayKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={BAR_COLOURS[i % BAR_COLOURS.length]}
              radius={[3, 3, 0, 0]}
              fillOpacity={0.88}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}