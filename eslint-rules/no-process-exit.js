/**
 * ESLint rule: disallow usage of process.exit() anywhere in the codebase.
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow process.exit calls",
      category: "Best Practices",
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee &&
          node.callee.object &&
          node.callee.object.name === "process" &&
          node.callee.property &&
          node.callee.property.name === "exit"
        ) {
          context.report({
            node,
            message: "Calling process.exit is prohibited.",
          });
        }
      },
    };
  },
};
