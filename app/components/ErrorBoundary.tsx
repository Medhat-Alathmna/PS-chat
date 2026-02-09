"use client";

import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-100 to-sky-200 px-4">
          <div className="text-center bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl max-w-sm">
            <div className="text-6xl mb-4">😅</div>
            <h2 className="text-2xl font-bold text-[var(--kids-purple)] mb-2">
              أوبس! صار خطأ
            </h2>
            <p className="text-gray-600 mb-6">
              لا تقلق! جرب تاني 🌟
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-6 py-3 bg-[var(--kids-green)] text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-transform shadow-md"
            >
              حاول مرة تانية 🔄
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
