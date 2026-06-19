/**
 * ESLint rule: disallow synchronous filesystem methods (fs.*Sync).
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow synchronous fs methods",
      category: "Best Practices",
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (
          node.object &&
          node.object.name === "fs" &&
          node.property &&
          typeof node.property.name === "string" &&
          node.property.name.endsWith("Sync")
        ) {
          context.report({
            node,
            message: "Synchronous fs methods are prohibited.",
          });
        }
      },
    };
  },
};
