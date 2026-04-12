import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50">
            <AlertCircle className="text-rose-500" size={40} />
          </div>
          <h2 className="mb-3 text-2xl font-black tracking-tight text-slate-900 uppercase">
            System Node Failure
          </h2>
          <p className="mb-8 max-w-md leading-relaxed font-bold text-slate-500">
            The module encountered a critical projection error. This has been
            logged for administrative review.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 text-xs font-black tracking-widest text-white uppercase shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95"
          >
            <RefreshCcw size={18} />
            Reinitialize Terminal
          </button>
          {import.meta.env.DEV && (
            <div className="mt-8 max-w-full overflow-auto rounded-xl bg-slate-50 p-4 text-left">
              <p className="font-mono text-[10px] font-bold text-rose-600">
                {this.state.error?.toString()}
              </p>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
