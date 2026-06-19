const { z } = require('zod');

/**
 * [AETHER-BRIDGE] Zod Schemas for Structural Integrity
 * Version: 15.1-Apex
 */

// Schema for Bridge State (.agents/memory/telepathy/bridge.json)
const BridgeStateSchema = z.object({
  status: z.enum(['ACTIVE', 'IDLE', 'ERROR', 'PLANNING']),
  last_agent: z.string().optional(),
  active_goal: z.string().optional(),
  consecutive_failures: z.number().default(0),
  timestamp: z.string().datetime().optional(), // ISO string
  pulses: z.array(z.object({
    id: z.string().uuid(),
    sender: z.string(),
    content: z.string(),
    timestamp: z.string().datetime()
  })).optional()
});

// Generic Tool Argument Schema (for validation before exec)
const ToolArgsSchema = z.record(z.any());

// Specific schemas for critical tools
const FileEditSchema = z.object({
  file_path: z.string(),
  old_string: z.string(),
  new_string: z.string()
});

const BashSchema = z.object({
  command: z.string(),
  description: z.string().optional()
});

const AuditEntrySchema = z.object({
  timestamp: z.string().datetime(),
  type: z.string(),
  agent: z.string().optional(),
  action: z.string(),
  params: z.record(z.any()).optional(),
  status: z.enum(['SUCCESS', 'FAIL', 'PENDING']),
  duration_ms: z.number().optional(),
  error: z.string().optional(),
  user: z.string().optional(),
  project: z.string().optional(),
  sessionId: z.string().optional(),
  thought: z.string().optional()
}).passthrough();

module.exports = {
  BridgeStateSchema,
  ToolArgsSchema,
  FileEditSchema,
  BashSchema,
  AuditEntrySchema
};
