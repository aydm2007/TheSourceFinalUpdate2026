/* eslint-disable @typescript-eslint/no-var-requires */
const React = require("react");

/**
 * Props for GlassCard component.
 * @typedef {Object} GlassCardProps
 * @property {React.ReactNode} children - Content to render inside the card.
 * @property {string} [className] - Optional CSS class name.
 * @property {React.CSSProperties} [style] - Optional inline style overrides.
 */

/**
 * GlassCard – a reusable container with glass‑morphism styling.
 *
 * Example usage:
 *   <GlassCard className="my-card">Content here</GlassCard>
 *
 * @param {GlassCardProps} props
 * @returns {JSX.Element}
 */
function GlassCard({ children, className = "", style }) {
  const glassStyle = {
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    background: "rgba(255, 255, 255, 0.15)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
    padding: "1rem",
    ...style,
  };

  return React.createElement("div", { className, style: glassStyle }, children);
}

module.exports = GlassCard;
