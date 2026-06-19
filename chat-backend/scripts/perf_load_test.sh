#!/bin/bash
# Simple load test for Performance Agent
# Uses autocannon (npm install -g autocannon) if available

if ! command -v autocannon &> /dev/null; then
  echo "autocannon not found, installing..."
  npm install -g autocannon
fi

# Target endpoint (replace with actual if different)
TARGET="http://localhost:3847/api/v1/status"

echo "Running load test on $TARGET..."

autocannon -c 50 -d 30 -p 10 $TARGET > $(dirname "$0")/../reports/perf_load_test.log 2>&1

RET=$?
if [ $RET -eq 0 ]; then
  echo "Load test completed successfully."
else
  echo "Load test failed with exit code $RET."
fi

exit $RET
