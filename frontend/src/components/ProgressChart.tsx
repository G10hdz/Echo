import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Award, Target, BookOpen } from 'lucide-react';

interface ProgressChartProps {
  data: Array<{
    date: string;
    score: number;
  }>;
  stats: {
    avgScore: number;
    totalSessions: number;
    streakDays: number;
    wordsPracticed: number;
  };
}

export function ProgressChart({ data, stats }: ProgressChartProps) {
  const StatCard = ({
    icon: Icon,
    label,
    value,
    suffix = '',
  }: {
    icon: any;
    label: string;
    value: number;
    suffix?: string;
  }) => (
    <div className="card">
      <div className="flex items-start gap-3">
        <div
          className="p-2.5 rounded-lg"
          style={{
            backgroundColor: 'var(--accent-container)',
          }}
        >
          <Icon size={20} style={{ color: 'var(--accent)' }} aria-hidden="true" />
        </div>
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wide mb-0.5"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            {label}
          </p>
          <p
            className="text-2xl font-bold"
            style={{
              fontFamily: 'var(--font-headline)',
              color: 'var(--on-surface)',
              lineHeight: 1.2,
            }}
          >
            {value}
            {suffix}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Average Score"
          value={Math.round(stats.avgScore)}
          suffix="%"
        />
        <StatCard
          icon={Award}
          label="Sessions"
          value={stats.totalSessions}
        />
        <StatCard
          icon={Target}
          label="Day Streak"
          value={stats.streakDays}
        />
        <StatCard
          icon={BookOpen}
          label="Words"
          value={stats.wordsPracticed}
        />
      </div>

      {/* Score Progression Chart */}
      {data.length > 0 ? (
        <div className="card">
          <h3
            className="text-xl font-semibold mb-6"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
          >
            30-Day Progress
          </h3>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--outline-variant)"
              />
              <XAxis
                dataKey="date"
                stroke="var(--on-surface-variant)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--on-surface-variant)"
                fontSize={12}
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface-container-lowest)',
                  border: '1px solid var(--outline-variant)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  fontSize: '0.875rem',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--accent)"
                strokeWidth={2.5}
                dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'var(--accent)', strokeWidth: 2, stroke: 'var(--accent-container)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p style={{ color: 'var(--on-surface-variant)' }}>
            Practice at least 2 sessions to see your progress chart.
          </p>
        </div>
      )}
    </div>
  );
}