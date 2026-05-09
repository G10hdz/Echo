import { Component, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { PracticePage } from './pages/PracticePage';
import { ProgressPage } from './pages/ProgressPage';
import { AlertTriangle } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8">
          <div className="card max-w-md text-center">
            <AlertTriangle
              size={48}
              style={{ color: 'var(--accent)', margin: '0 auto var(--spacing-md)' }}
              aria-hidden="true"
            />
            <h2
              className="text-2xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              Something went wrong
            </h2>
            <p style={{ color: 'var(--on-surface-variant)' }} className="mb-6">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <button
              className="btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
      <h1
        className="text-3xl font-bold mb-4"
        style={{ fontFamily: 'var(--font-headline)' }}
      >
        Settings
      </h1>
      <div className="card">
        <p style={{ color: 'var(--on-surface-variant)' }}>
          Language, level, and voice settings coming soon.
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <Sidebar />
          <main
            id="main-content"
            className="md:ml-[var(--sidebar-width)] min-h-screen"
            style={{ paddingLeft: '0', paddingTop: '3.5rem', maxWidth: '100%' }}
          >
            <div className="max-w-[var(--content-max)] mx-auto">
              <Routes>
                <Route path="/" element={<PracticePage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </main>
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;