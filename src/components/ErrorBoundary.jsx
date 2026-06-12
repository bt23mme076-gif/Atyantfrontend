import { Component } from "react";

// Catches any render crash below it and shows a friendly recovery screen
// instead of a blank white page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 14,
        background: "var(--c-bg, #fff)", color: "var(--c-text, #111)",
        fontFamily: "system-ui, sans-serif", padding: 24, textAlign: "center",
      }}>
        <div style={{ fontSize: 44 }}>😵</div>
        <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>Something went wrong</h2>
        <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.7, maxWidth: 360 }}>
          An unexpected error occurred. Reloading usually fixes it — your data is safe.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8, padding: "10px 28px", borderRadius: 12, border: "none",
            background: "linear-gradient(90deg,#7567C9,#5a52a8)", color: "#fff",
            fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
          }}
        >
          Reload page
        </button>
      </div>
    );
  }
}
