/* Auto-Session Termination Feature */

/**
 * Starts an inactivity timer that automatically terminates the chat session
 * after a specified period of no user activity.
 *
 * @param {number} timeoutMs - Inactivity timeout in milliseconds.
 * @param {function} onTerminate - Callback invoked when the session should be terminated.
 * @returns {{reset: function, stop: function}} Control object to manage the timer.
 */
function startAutoTermination(timeoutMs, onTerminate) {
  if (typeof timeoutMs !== 'number' || timeoutMs <= 0) {
    throw new Error('Invalid timeout value for auto-session termination');
  }
  if (typeof onTerminate !== 'function') {
    throw new Error('onTerminate callback must be a function');
  }

  let timerId = null;

  const reset = () => {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      try {
        onTerminate();
      } catch (e) {
        console.error('Error during session termination callback:', e);
      }
    }, timeoutMs);
  };

  const stop = () => {
    clearTimeout(timerId);
  };

  // Initialize timer
  reset();

  // Attach listeners for common user interactions
  const activityEvents = ['click', 'keydown', 'mousemove', 'touchstart'];
  activityEvents.forEach(event => {
    window.addEventListener(event, reset);
  });

  // Cleanup listeners when stopped
  const cleanup = () => {
    activityEvents.forEach(event => {
      window.removeEventListener(event, reset);
    });
    stop();
  };

  // Return control interface
  return {
    reset,
    stop: () => {
      cleanup();
    }
  };
}

module.exports = {
  startAutoTermination
};
