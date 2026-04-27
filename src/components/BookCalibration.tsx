import React, { useState } from 'react';

const Input = ({ label, value, onChange, min, max, step = 1 }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
    <span style={{ width: '80px' }}>{label}</span>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step} 
      value={value} 
      onChange={e => onChange(parseFloat(e.target.value))} 
      style={{ width: '100px' }} 
    />
    <span style={{ width: '30px', textAlign: 'right' }}>{value}</span>
  </div>
);

export const BookCalibration: React.FC = () => {
  const [container, setContainer] = useState({
    left: 40,
    bottom: 8,
    width: 14,
    height: 8,
    rotateX: 45,
    rotateY: 0,
    rotateZ: 5,
  });

  const [page, setPage] = useState({
    hoverRotateY: -140,
    hoverSkewY: 0,
    hoverScale: 1,
    originX: 0, // left
  });

  const [isHovered, setIsHovered] = useState(false);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${container.left}%`,
    bottom: `${container.bottom}%`,
    width: `${container.width}%`,
    height: `${container.height}%`,
    transform: `perspective(500px) rotateX(${container.rotateX}deg) rotateY(${container.rotateY}deg) rotateZ(${container.rotateZ}deg)`,
    transformStyle: 'preserve-3d',
    border: '2px solid rgba(255,0,0,0.5)',
    zIndex: 200,
  };

  const pageBaseStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    background: 'linear-gradient(to right, rgba(230,230,230,0.8), rgba(255,255,255,0.95))',
    transformOrigin: `${page.originX}% center`,
    transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
    boxShadow: 'inset 1px 0 3px rgba(0,0,0,0.2)',
    border: '1px solid blue',
  };

  const pageHoverStyle: React.CSSProperties = {
    ...pageBaseStyle,
    transform: `rotateY(${page.hoverRotateY}deg) skewY(${page.hoverSkewY}deg) scale(${page.hoverScale})`,
    boxShadow: '-3px 0 10px rgba(0,0,0,0.5), inset -1px 0 3px rgba(0,0,0,0.2)',
  };

  const exportCss = () => {
    const css = `
.archive-book-trigger {
  position: absolute;
  bottom: ${container.bottom}%;
  left: ${container.left}%;
  width: ${container.width}%;
  height: ${container.height}%;
  transform: perspective(500px) rotateX(${container.rotateX}deg) rotateY(${container.rotateY}deg) rotateZ(${container.rotateZ}deg);
}

.archive-book-trigger .page {
  transform-origin: ${page.originX}% center;
}

.archive-book-trigger:hover .page {
  transform: rotateY(${page.hoverRotateY}deg) skewY(${page.hoverSkewY}deg) scale(${page.hoverScale});
}
`;
    navigator.clipboard.writeText(css);
    alert('CSS copied to clipboard!');
  };

  return (
    <>
      <div style={containerStyle}>
        <div style={isHovered ? pageHoverStyle : pageBaseStyle} />
      </div>

      <div style={{
        position: 'absolute', top: 20, left: 20, width: 280,
        background: 'rgba(0,0,0,0.8)', color: 'white', padding: '15px',
        borderRadius: '8px', zIndex: 1000, fontFamily: 'monospace'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Book Calibration</h3>
        
        <div style={{ borderBottom: '1px solid #444', marginBottom: '10px', paddingBottom: '10px' }}>
          <strong>Container</strong>
          <Input label="Left %" value={container.left} min={0} max={100} step={0.1} onChange={(v: number) => setContainer({...container, left: v})} />
          <Input label="Bottom %" value={container.bottom} min={0} max={100} step={0.1} onChange={(v: number) => setContainer({...container, bottom: v})} />
          <Input label="Width %" value={container.width} min={1} max={50} step={0.1} onChange={(v: number) => setContainer({...container, width: v})} />
          <Input label="Height %" value={container.height} min={1} max={50} step={0.1} onChange={(v: number) => setContainer({...container, height: v})} />
          <Input label="RotateX" value={container.rotateX} min={-90} max={90} onChange={(v: number) => setContainer({...container, rotateX: v})} />
          <Input label="RotateY" value={container.rotateY} min={-90} max={90} onChange={(v: number) => setContainer({...container, rotateY: v})} />
          <Input label="RotateZ" value={container.rotateZ} min={-90} max={90} onChange={(v: number) => setContainer({...container, rotateZ: v})} />
        </div>

        <div style={{ borderBottom: '1px solid #444', marginBottom: '10px', paddingBottom: '10px' }}>
          <strong>Page Animation</strong>
          <Input label="Origin X%" value={page.originX} min={-100} max={200} onChange={(v: number) => setPage({...page, originX: v})} />
          <Input label="Hover RotY" value={page.hoverRotateY} min={-180} max={180} onChange={(v: number) => setPage({...page, hoverRotateY: v})} />
          <Input label="Hover SkewY" value={page.hoverSkewY} min={-90} max={90} onChange={(v: number) => setPage({...page, hoverSkewY: v})} />
          <Input label="Hover Scale" value={page.hoverScale} min={0.5} max={2} step={0.01} onChange={(v: number) => setPage({...page, hoverScale: v})} />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button 
            onPointerDown={() => setIsHovered(true)} 
            onPointerUp={() => setIsHovered(false)}
            onPointerLeave={() => setIsHovered(false)}
            style={{ flex: 1, padding: '5px', background: '#44f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Hold to Flip
          </button>
          <button onClick={exportCss} style={{ flex: 1, padding: '5px', background: '#4f4', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Copy CSS
          </button>
        </div>
      </div>
    </>
  );
};
