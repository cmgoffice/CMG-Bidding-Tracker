import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50 rounded-2xl border border-rose-200 m-4">
          <div className="max-w-lg w-full bg-white p-6 rounded-2xl shadow-lg border border-rose-100 text-center">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">
              {this.props.fallbackTitle || "เกิดข้อผิดพลาดในการแสดงผล"}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              {this.state.error?.message || "An unexpected error occurred in this view."}
            </p>
            {this.state.errorInfo && (
              <div className="bg-slate-900 text-slate-200 text-left p-3 rounded-xl text-[11px] font-mono overflow-auto max-h-40 mb-4">
                {this.state.error?.stack || this.state.errorInfo.componentStack}
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 mx-auto shadow-md shadow-blue-500/20"
            >
              <RefreshCw size={14} /> โหลดหน้านี้ใหม่ (Reload)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
