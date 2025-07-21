import { useEffect } from 'react';
import { useCalculatorStore } from '@/contexts/CalculatorStore';
import GraphCanvas from '@/components/GraphCanvas/GraphCanvas';
import ExpressionEditor from '@/components/ExpressionEditor/ExpressionEditor';
import Toolbar from '@/components/Toolbar/Toolbar';
import './App.css';

function App() {
  const theme = useCalculatorStore(state => state.settings.theme);
  const errors = useCalculatorStore(state => state.errors);
  const clearErrors = useCalculatorStore(state => state.clearErrors);

  // Apply theme to document
  useEffect(() => {
    if (theme.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme.mode]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Compact Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Graphyy
            </h1>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Enhanced Desmos-like Graphing Calculator
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 hidden lg:block">
            Built with React 19 • TypeScript • Tailwind CSS
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex-shrink-0">
        <Toolbar />
      </div>

      {/* Error banner */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900 border-b border-red-200 dark:border-red-700 px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-red-600 dark:text-red-400 text-sm">
                <span className="font-medium">Error:</span> {errors[0].message}
              </div>
              {errors[0].suggestions && errors[0].suggestions.length > 0 && (
                <div className="text-xs text-red-500 dark:text-red-300">
                  Suggestions: {errors[0].suggestions.join(', ')}
                </div>
              )}
            </div>
            <button
              onClick={clearErrors}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main content - Full width layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar - Expression Editor (25% width) */}
        <aside className="w-1/4 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0 p-3">
          <ExpressionEditor />
        </aside>

        {/* Main canvas area - Takes remaining width (75%) */}
        <main className="w-3/4 bg-white dark:bg-gray-900 overflow-hidden min-w-0">
          <GraphCanvas className="w-full h-full" />
        </main>
      </div>

      {/* Compact Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div>Advanced mathematical visualization and computation</div>
          <div className="hidden md:flex items-center space-x-2">
            <span>React 19 Powered</span>
            <span>•</span>
            <span>High Performance Canvas</span>
            <span>•</span>
            <span>Real-time Analysis</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
