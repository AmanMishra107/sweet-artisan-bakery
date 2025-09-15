import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  info?: { componentStack: string };
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log detailed error info to the console for debugging
    console.error("ErrorBoundary caught an error:", { error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
          <div className="max-w-lg">
            <h1 className="text-2xl font-bold mb-2">Something went wrong.</h1>
            <p className="text-muted-foreground mb-6">We encountered an unexpected error. Please try refreshing the page. If the issue persists, we will investigate.</p>
            <button
              className="px-4 py-2 rounded-md border bg-card hover:bg-accent transition"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
