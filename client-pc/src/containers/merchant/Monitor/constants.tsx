import styles from './index.module.css';



type SeriesRow = { date: string; value: number };

type LineChartProps = {
  data: SeriesRow[];
  color: string;
  valueSuffix?: string;
};

export function LineChart({ data, color, valueSuffix }: LineChartProps) {
  const width = 300;
  const height = 120;
  const padding = 10;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const last = data[data.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartBox}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={points.join(' ')}
        />
        {points.map((p, idx) => {
          const [x, y] = p.split(',').map(Number);
          return <circle key={data[idx].date} cx={x} cy={y} r="3" fill={color} />;
        })}
      </svg>
      <div className={styles.chartAxis}>
        <span>{data[0]?.date}</span>
        <span>
          当前：{last?.value}
          {valueSuffix}
        </span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export function stableHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function seededRandom(seed: string, min: number, max: number) {
  const h = stableHash(seed);
  const normalized = (h % 1000) / 1000;
  return Math.round(min + normalized * (max - min));
}

export function makeSeries(seed: string, days = 7, min = 60, max = 90): SeriesRow[] {
  const today = new Date();
  return Array.from({ length: days }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - idx));
    const date = `${d.getMonth() + 1}.${d.getDate()}`;
    return {
      date,
      value: seededRandom(`${seed}-${idx}`, min, max),
    };
  });
}
