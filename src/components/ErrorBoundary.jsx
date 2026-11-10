import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 bg-[#0E1621] border border-amber-500/30 rounded-2xl text-slate-200 m-4 shadow-xl">
          <div className="size-10 rounded-xl bg-amber-500/15 border border-amber-500/30 grid place-items-center text-amber-400 mb-3">
            <AlertTriangle className="size-5" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">
            {this.props.title || 'Terjadi Kendala Tampilan'}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm text-center mb-4">
            {this.state.error?.message || 'Komponen mengalami kendala sementara saat memproses data poligon.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 hover:bg-teal-500/25 text-teal-300 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="size-3.5" />
            <span>Muat Ulang Komponen</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
