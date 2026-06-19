import React, { useEffect, useState } from 'react';

const TelepathyCursors = () => {
  const [cursors, setCursors] = useState({});

  useEffect(() => {
    // Gen-8 P2P Mesh Connection
    const ws = new WebSocket('ws://localhost:9998');
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'LAN_CURSOR_SYNC') {
          setCursors(prev => ({
            ...prev,
            [data.userId || 'admin-remote']: data.selections
          }));
        }
      } catch (e) {
        console.error('Telepathy Sync Error', e);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%', zIndex: 9999 }}>
      {Object.entries(cursors).map(([id, selection]) => (
        <div key={id} style={{
          position: 'absolute',
          // Simulated positioning based on selections
          left: `${Math.random() * 80 + 10}%`,
          top: `${Math.random() * 80 + 10}%`,
          backgroundColor: 'rgba(255,0,0,0.5)',
          padding: '2px 5px',
          borderRadius: '4px',
          color: 'white',
          fontSize: '10px'
        }}>
          {id}
        </div>
      ))}
    </div>
  );
};

export default TelepathyCursors;
