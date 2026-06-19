/**
 * ESLint rule: disallow top‑level side‑effects (e.g., executing code at module scope).
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow top‑level side effects",
      category: "Best Practices",
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    return {
      ExpressionStatement(node) {
        // If the expression is directly under Program, it's a top‑level side effect.
        if (node.parent && node.parent.type === "Program") {
          context.report({
            node,
            message: "Top‑level side effects are prohibited.",
          });
        }
      },
    };
  },
};
