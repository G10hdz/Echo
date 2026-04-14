// Progress chart component using Recharts

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Award, Target, Clock } from 'lucide-react';

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
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--primary-fixed)',
          }}
        >
          <Icon size={24} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <p
            className="text-sm mb-1"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            {label}
          </p>
          <p
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-headline)' }}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Average Score"
          value={stats.avgScore}
          suffix="%"
        />
        <StatCard
          icon={Award}
          label="Total Sessions"
          value={stats.totalSessions}
        />
        <StatCard
          icon={Target}
          label="Current Streak"
          value={stats.streakDays}
          suffix=" days"
        />
        <StatCard
          icon={Clock}
          label="Words Practiced"
          value={stats.wordsPracticed}
        />
      </div>

      {/* Score Progression Chart */}
      <div className="card">
        <h3
          className="text-xl font-semibold mb-6"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          30-Day Progress
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--surface-container)"
            />
            <XAxis
              dataKey="date"
              stroke="var(--on-surface-variant)"
              fontSize={12}
            />
            <YAxis
              stroke="var(--on-surface-variant)"
              fontSize={12}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface-container-lowest)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#gradient)"
              strokeWidth={3}
              dot={{ fill: 'var(--primary)', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="0%"
                  stopColor="var(--primary)"
                />
                <stop
                  offset="100%"
                  stopColor="var(--primary-container)"
                />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
