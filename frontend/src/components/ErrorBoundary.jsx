import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Structured error reporting
    console.error('[ErrorBoundary] Caught:', {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    })
    this.setState({ errorInfo })
  }

  handleRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const isDev = import.meta.env?.DEV

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-syne font-bold text-xl mb-2">Something went wrong</h2>
          <p className="text-muted text-sm mb-6 leading-relaxed">
            An unexpected error occurred. Your data is safe — try recovering or refreshing the page.
          </p>

          {/* Show error details in dev, minimal in production */}
          <code className="block bg-s2 border border-white/[0.07] rounded-xl p-3 text-xs font-mono text-red/80 text-left mb-6 break-all max-h-32 overflow-auto">
            {isDev
              ? `${this.state.error?.message}\n\n${this.state.error?.stack?.slice(0, 500)}`
              : (this.state.error?.message || 'Unknown error')
            }
          </code>

          <div className="flex gap-3">
            <button
              onClick={this.handleRecover}
              className="btn-ghost flex-1"
            >
              Try to Recover
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary flex-1"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    )
  }
}

