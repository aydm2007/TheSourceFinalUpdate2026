import client from "prom-client";

try {
  client.collectDefaultMetrics();
} catch (e) {
  // Suppress warnings when running multiple times in tests
}

export const requests = new client.Counter({
  name: "agent_requests",
  help: "agent count",
});

export const responseTime = new client.Histogram({
  name: "response_time",
  help: "latency of agent actions in seconds",
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});
