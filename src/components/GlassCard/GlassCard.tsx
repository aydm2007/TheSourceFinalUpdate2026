// GlassCard component (CommonJS)
const React = require('react');
const styles = require('./GlassCard.module.css');

/** @type {{children?: React.ReactNode, className?: string}} */
function GlassCard({ children, className }) {
  return React.createElement(
    'div',
    { className: `${styles.glassCard} ${className ?? ''}`.trim() },
    children
  );
}

module.exports = GlassCard;
