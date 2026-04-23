import React, { useState, useRef } from 'react';
import boxImg from '../assets/box.png';

export interface Slot {
  left: string;
  top: string;
  width: string;
  rotateY: string;
  skewY: string;
}

// Manually mapped coordinates for the shelves in room_bg.png
interface RowBounds {
  leftTop: number;
  rightTop: number;
}

function generateGrid(
  leftEdge: number,
  rightEdge: number,
  cols: number,
  rows: RowBounds[],
  width: string,
  rotateY: string,
  skewY: string
): Slot[] {
  const slots: Slot[] = [];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols; c++) {
      const leftPercent = cols <= 1 ? leftEdge : leftEdge + (rightEdge - leftEdge) * (c / (cols - 1));
      const topPercent = cols <= 1 ? rows[r].leftTop : rows[r].leftTop + (rows[r].rightTop - rows[r].leftTop) * (c / (cols - 1));
      slots.push({
        left: `${leftPercent.toFixed(1)}%`,
        top: `${topPercent.toFixed(1)}%`,
        width,
        rotateY,
        skewY
      });
    }
  }
  return slots;
}

const RIGHT_SHELF_SLOTS = generateGrid(
  72.2, 87.4, 3,
  [
    { leftTop: 20.0, rightTop: 25.9 },
    { leftTop: 33.8, rightTop: 39.1 },
    { leftTop: 47.4, rightTop: 54.2 },
    { leftTop: 58.5, rightTop: 66.3 },
    { leftTop: 71.8, rightTop: 81.0 }
  ],
  '8.5%', '0deg', '0deg'
);

const MIDDLE_SHELF_SLOTS = generateGrid(
  44.5, 63.1, 4,
  [
    { leftTop: 8.0, rightTop: 15.2 },
    { leftTop: 20.3, rightTop: 29.3 },
    { leftTop: 34.5, rightTop: 42.0 },
    { leftTop: 47.6, rightTop: 54.7 },
    { leftTop: 60.9, rightTop: 67.9 }
  ],
  '6.5%', '25deg', '-4deg'
);

const LEFT_SHELF_SLOTS = generateGrid(
  12.5, 31.2, 4,
  [
    { leftTop: 13.7, rightTop: 6.8 },
    { leftTop: 27.1, rightTop: 18.1 },
    { leftTop: 40.7, rightTop: 31.8 },
    { leftTop: 53.4, rightTop: 44.9 },
    { leftTop: 64.3, rightTop: 58.8 }
  ],
  '6.5%', '-25deg', '4deg'
);

const INITIAL_SLOTS = [...LEFT_SHELF_SLOTS, ...MIDDLE_SHELF_SLOTS, ...RIGHT_SHELF_SLOTS];

interface BoxData {
  id: string;
  label: string;
}

interface ShelfOverlayProps {
  boxes: BoxData[];
  onBoxClick: (box: BoxData) => void;
}

export const ShelfOverlay: React.FC<ShelfOverlayProps> = ({ boxes, onBoxClick }) => {
  const [slots, setSlots] = useState<Slot[]>(INITIAL_SLOTS);
  const [editMode, setEditMode] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent, idx: number) => {
    if (!editMode) return;
    e.preventDefault();
    setDraggingIdx(idx);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!editMode || draggingIdx === null || !overlayRef.current) return;
    
    const rect = overlayRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    setSlots(prev => {
      const newSlots = [...prev];
      newSlots[draggingIdx] = {
        ...newSlots[draggingIdx],
        left: `${xPercent.toFixed(1)}%`,
        top: `${yPercent.toFixed(1)}%`
      };
      return newSlots;
    });
  };

  const handlePointerUp = () => {
    if (draggingIdx !== null) {
      setDraggingIdx(null);
    }
  };

  const exportCoordinates = () => {
    const json = JSON.stringify(slots, null, 2);
    navigator.clipboard.writeText(json);
    alert("Coordinates copied to clipboard! Paste them to Antigravity.");
  };

  return (
    <>
      <div 
        className="shelf-overlay" 
        ref={overlayRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {boxes.map((box, idx) => {
          if (idx >= slots.length) return null;
          
          const slot = slots[idx];
          
          return (
            <div 
              key={box.id} 
              className="shelf-box"
              onPointerDown={(e) => handlePointerDown(e, idx)}
              onClick={() => !editMode && onBoxClick(box)}
              style={{
                left: slot.left,
                top: slot.top,
                width: slot.width,
                transform: `perspective(1000px) rotateY(${slot.rotateY}) skewY(${slot.skewY}) translate(-50%, -50%)`,
                cursor: editMode ? 'move' : 'pointer',
                transition: draggingIdx === idx ? 'none' : undefined,
                zIndex: draggingIdx === idx ? 1000 : undefined
              }}
            >
              <div className="box-inner">
                <img src={boxImg} className="box-image" alt="Comic Box" draggable={false} />
                <div className="box-label">
                  <span>{box.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Edit Mode Toggle HUD */}
      <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 100, display: 'flex', gap: '10px' }}>
        <button 
          className="hud-btn" 
          style={{ background: editMode ? 'rgba(255, 50, 50, 0.8)' : undefined }}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Finish Editing' : '🛠️ Edit Box Layout'}
        </button>
        {editMode && (
          <button className="hud-btn" onClick={exportCoordinates}>
            📋 Copy JSON
          </button>
        )}
      </div>
    </>
  );
};
