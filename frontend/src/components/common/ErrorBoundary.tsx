import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-12 bg-white rounded-[32px] border-2 border-dashed border-slate-200 text-center">
          <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6">
            <AlertCircle className="text-rose-500" size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">System Node Failure</h2>
          <p className="text-slate-500 font-bold max-w-md mb-8 leading-relaxed">
            The module encountered a critical projection error. This has been logged for administrative review.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
          >
            <RefreshCcw size={18} />
            Reinitialize Terminal
          </button>
          {import.meta.env.DEV && (
            <div className="mt-8 p-4 bg-slate-50 rounded-xl text-left overflow-auto max-w-full">
              <p className="text-[10px] font-mono text-rose-600 font-bold">{this.state.error?.toString()}</p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
