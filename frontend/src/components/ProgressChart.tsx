import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Award, Target, BookOpen, LineChart as LineChartIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    icon: LucideIcon;
    label: string;
    value: number;
    suffix?: string;
  }) => (
    <div className="card">
      <div className="flex items-start gap-3">
        <div
          className="p-2.5 rounded-lg"
          style={{
            backgroundColor: 'var(--primary-container)',
          }}
        >
          <Icon size={20} style={{ color: 'var(--primary)' }} aria-hidden="true" />
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
          label="Puntuación media"
          value={Math.round(stats.avgScore)}
          suffix="%"
        />
        <StatCard
          icon={Award}
          label="Sesiones"
          value={stats.totalSessions}
        />
        <StatCard
          icon={Target}
          label="Racha (días)"
          value={stats.streakDays}
        />
        <StatCard
          icon={BookOpen}
          label="Palabras"
          value={stats.wordsPracticed}
        />
      </div>

      {/* Gráfica de progresión */}
      {data.length > 0 ? (
        <div className="card">
          <h3
            className="text-xl font-semibold mb-6"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
          >
            Evolución de tu puntuación
          </h3>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border-light)"
              />
              <XAxis
                dataKey="date"
                stroke="var(--muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted)"
                fontSize={12}
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  fontSize: '0.875rem',
                  color: 'var(--fg)',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--teal)"
                strokeWidth={2.5}
                dot={{ fill: 'var(--teal)', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'var(--teal)', strokeWidth: 2, stroke: 'var(--primary-container)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          className="card text-center py-12 flex flex-col items-center"
        >
          <LineChartIcon
            size={40}
            style={{ color: 'var(--on-surface-variant)', opacity: 0.4, marginBottom: '1rem' }}
            aria-hidden="true"
          />
          <h3
            className="text-lg font-semibold mb-2"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
          >
            Aún no hay datos suficientes
          </h3>
          <p
            className="mb-6"
            style={{ color: 'var(--on-surface-variant)', maxWidth: '24rem' }}
          >
            Completa al menos 2 sesiones de práctica para ver la evolución de tu puntuación.
          </p>
          <Link to="/practice" className="btn-secondary">
            Ir a practicar
          </Link>
        </div>
      )}
    </div>
  );
}
