import { Component } from 'react';

// Without this, an unhandled error anywhere in the tree unmounts the
// whole app to a blank white screen. This catches it at the top level
// and shows something actionable instead, then lets the person
// navigate away rather than being stuck.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="max-w-md mx-auto mt-24 px-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-muted text-sm mb-6">
            This page hit an unexpected error. Try reloading, or head back to the dashboard.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="text-sm border border-border px-4 py-2 rounded-md hover:border-accent transition-colors"
            >
              Reload
            </button>
            <a
              href="/"
              className="text-sm bg-accent text-bg font-medium px-4 py-2 rounded-md hover:bg-accentDim transition-colors"
            >
              Go home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
