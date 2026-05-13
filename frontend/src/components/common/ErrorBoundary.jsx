import { Component } from "react";
import { ui } from "../../styles/ui";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-[60vh] place-items-center p-8">
          <div className={`${ui.panel} max-w-lg text-center`}>
            <p className={ui.eyebrow}>Something went wrong</p>
            <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.005em] text-[#0E0E10]">
              This section failed to load
            </h2>
            <p className={`${ui.muted} mt-2`}>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              className={`${ui.buttonSecondary} mt-5`}
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
