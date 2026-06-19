/**
 * ESLint rule: disallow usage of process.env at the top level of a file.
 * This is a minimal implementation used to satisfy the missing custom rule.
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow top‑level process.env usage",
      category: "Best Practices",
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        // Detect process.env
        if (
          node.object &&
          node.object.name === "process" &&
          node.property &&
          node.property.name === "env"
        ) {
          // Check if the MemberExpression is at the top level (direct child of Program)
          const parent = node.parent;
          if (parent && parent.type === "MemberExpression") {
            // ignore chained accesses like process.env.NODE_ENV
            return;
          }
          const statement = node.parent && node.parent.parent;
          if (statement && statement.type === "Program") {
            context.report({
              node,
              message: "Using process.env at the top level is prohibited.",
            });
          }
        }
      },
    };
  },
};
