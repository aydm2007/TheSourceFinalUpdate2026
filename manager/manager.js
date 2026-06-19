// manager/manager.js
const express = require('express');
const { Worker } = require('worker_threads');
const { v4: uuidv4 } = require('uuid');
const app = express();
app.use(express.json());

// Map of sessionId -> Worker instance
const workers = new Map();

/** Start a new worker for a session */
app.post('/session/:sessionId/start', (req, res) => {
  const { sessionId } = req.params;
  if (workers.has(sessionId)) {
    return res.status(400).json({ error: 'Session already has a running worker' });
  }
  const worker = new Worker('./workers/worker.js');
  workers.set(sessionId, worker);
  res.json({ status: 'started', sessionId });
});

/** Run a task on an existing worker */
app.post('/session/:sessionId/run', (req, res) => {
  const { sessionId } = req.params;
  const worker = workers.get(sessionId);
  if (!worker) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const taskId = uuidv4();
  const payload = { ...req.body, id: taskId };
  worker.postMessage({ cmd: 'run', payload });
  // Listen for a single response
  const onMessage = (msg) => {
    if (msg.status === 'done') {
      res.json({ taskId, result: msg.result });
    } else {
      res.status(500).json({ taskId, error: msg.error || 'unknown' });
    }
    worker.off('message', onMessage);
  };
  worker.on('message', onMessage);
});

/** Stop and clean up a worker */
app.post('/session/:sessionId/stop', (req, res) => {
  const { sessionId } = req.params;
  const worker = workers.get(sessionId);
  if (worker) {
    worker.terminate();
    workers.delete(sessionId);
  }
  res.json({ status: 'stopped', sessionId });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Worker Manager listening on port ${PORT}`));
