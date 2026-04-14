// Main App component with routing

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { PracticePage } from './pages/PracticePage';
import { ProgressPage } from './pages/ProgressPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
          <Sidebar />

          {/* Main Content Area */}
          <main className="ml-[280px]">
            <Routes>
              <Route path="/" element={<PracticePage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route
                path="/settings"
                element={
                  <div className="max-w-4xl mx-auto px-8 py-12">
                    <h1
                      className="text-3xl font-bold mb-4"
                      style={{ fontFamily: 'var(--font-headline)' }}
                    >
                      Settings
                    </h1>
                    <p style={{ color: 'var(--on-surface-variant)' }}>
                      Settings page coming soon...
                    </p>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
