import { Component, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { PracticePage } from './pages/PracticePage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ResultsPage } from './pages/ResultsPage';
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
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--on-surface)' }}
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

/* ------------------------------------------------------------------ */
/*  Animated route wrapper — page-level transitions                     */
/* ------------------------------------------------------------------ */
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -12 },
};

const pageTransition = {
  type: 'tween',
  ease: [0.25, 0.1, 0.25, 1],
  duration: 0.3,
};


function OnboardingGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isOnboarded = localStorage.getItem('echo_onboarded') === 'true';
  const isOnboardingPage = location.pathname === '/onboarding';

  if (!isOnboarded && !isOnboardingPage) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
            >
              <HomePage />
            </motion.div>
          }
        />
        <Route
          path="/practice"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
            >
              <PracticePage />
            </motion.div>
          }
        />
        <Route
          path="/progress"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
            >
              <ProgressPage />
            </motion.div>
          }
        />
        <Route
          path="/settings"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
            >
              <SettingsPage />
            </motion.div>
          }
        />
        <Route
          path="/onboarding"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
            >
              <OnboardingPage />
            </motion.div>
          }
        />
        <Route
          path="/results"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
            >
              <ResultsPage />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}


function AppLayout() {
  const location = useLocation();
  const isOnboarding = location.pathname === '/onboarding';

  return (
    <OnboardingGate>
      {!isOnboarding && <Sidebar />}
      <main
        id="main-content"
        className={isOnboarding ? 'min-h-screen' : 'md:ml-[var(--sidebar-width)] min-h-screen pt-14 md:pt-0'}
      >
        <div className="max-w-[var(--content-max)] mx-auto">
          <AnimatedRoutes />
        </div>
      </main>
    </OnboardingGate>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <Router>
            <AppLayout />
          </Router>
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;