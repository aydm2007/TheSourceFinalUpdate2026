// Memory Anchor Hook
// Captures key state snapshots and anchors them into the semantic memory layer.
// This file is loaded by the core runtime during initialization.

function captureMemoryAnchor(context) {
  // Example: Persist important variables to the vector store
  if (global.memoryAnchor && typeof global.memoryAnchor.save === "function") {
    global.memoryAnchor.save(context);
  }
}

// Register the hook with the system (registration handled elsewhere)
if (typeof registerHook === "function") {
  registerHook("memoryAnchor", captureMemoryAnchor);
}

module.exports = { captureMemoryAnchor };
