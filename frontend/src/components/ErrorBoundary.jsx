import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('LeadPulse ErrorBoundary caught:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-syne font-bold text-xl mb-2">Something went wrong</h2>
          <p className="text-muted text-sm mb-6 leading-relaxed">
            An unexpected error occurred. Your data is safe — try refreshing the page.
          </p>
          <code className="block bg-s2 border border-white/[0.07] rounded-xl p-3 text-xs font-mono text-red/80 text-left mb-6 break-all">
            {this.state.error?.message || 'Unknown error'}
          </code>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary w-full"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }
}
