import React, { useState, useEffect } from 'react';

export const CornerCalibration: React.FC = () => {
  const [basePoints, setBasePoints] = useState([
    { x: 40, y: 80 }, { x: 50, y: 80 },
    { x: 50, y: 90 }, { x: 40, y: 90 }
  ]);

  const [hoverPoints, setHoverPoints] = useState([
    { x: 30, y: 70 }, { x: 45, y: 75 },
    { x: 45, y: 85 }, { x: 30, y: 80 }
  ]);

  const [activePoint, setActivePoint] = useState<{ state: 'base' | 'hover', index: number } | null>(null);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePoint) return;
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;

    if (activePoint.state === 'base') {
      const newPoints = [...basePoints];
      newPoints[activePoint.index] = { x, y };
      setBasePoints(newPoints);
    } else {
      const newPoints = [...hoverPoints];
      newPoints[activePoint.index] = { x, y };
      setHoverPoints(newPoints);
    }
  };

  const handlePointerUp = () => {
    setActivePoint(null);
  };

  const copyData = () => {
    const data = JSON.stringify({ basePoints, hoverPoints }, null, 2);
    navigator.clipboard.writeText(data);
    alert('Coordinates copied! Send them to Antigravity.');
  };

  return (
    <div 
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 9999, pointerEvents: activePoint ? 'auto' : 'none'
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <polygon 
          points={basePoints.map(p => `${p.x}%,${p.y}%`).join(' ')}
          fill="rgba(0, 150, 255, 0.4)" stroke="blue" strokeWidth="2"
        />
        <polygon 
          points={hoverPoints.map(p => `${p.x}%,${p.y}%`).join(' ')}
          fill="rgba(255, 50, 50, 0.4)" stroke="red" strokeWidth="2" strokeDasharray="5,5"
        />
      </svg>

      {basePoints.map((p, i) => (
        <div
          key={`base-${i}`}
          onPointerDown={(e) => { e.stopPropagation(); setActivePoint({ state: 'base', index: i }); }}
          style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: 10, height: 10,
            transform: 'translate(-50%, -50%)', background: 'blue', borderRadius: '50%',
            cursor: 'grab', pointerEvents: 'auto', border: '2px solid white'
          }}
        />
      ))}

      {hoverPoints.map((p, i) => (
        <div
          key={`hover-${i}`}
          onPointerDown={(e) => { e.stopPropagation(); setActivePoint({ state: 'hover', index: i }); }}
          style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: 10, height: 10,
            transform: 'translate(-50%, -50%)', background: 'red', borderRadius: '50%',
            cursor: 'grab', pointerEvents: 'auto', border: '2px solid white'
          }}
        />
      ))}

      <div style={{
        position: 'absolute', top: 20, left: 20, background: 'rgba(0,0,0,0.8)', color: 'white',
        padding: '15px', borderRadius: '8px', pointerEvents: 'auto'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Corner Calibration</h3>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>Blue = Base State</p>
        <p style={{ margin: '0 0 15px 0', fontSize: '12px' }}>Red = Hover State</p>
        <button onClick={copyData} style={{ padding: '8px 12px', cursor: 'pointer' }}>
          Copy Coordinates
        </button>
      </div>
    </div>
  );
};
