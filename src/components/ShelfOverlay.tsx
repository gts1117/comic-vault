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
// Right bookcase (flatter)
const RIGHT_SHELF_SLOTS: Slot[] = [
  { left: '69%', top: '24%', width: '8.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '78%', top: '25.5%', width: '8.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '87%', top: '27%', width: '8.5%', rotateY: '0deg', skewY: '0deg' },
  
  { left: '69%', top: '42%', width: '8.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '78%', top: '43.5%', width: '8.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '87%', top: '45%', width: '8.5%', rotateY: '0deg', skewY: '0deg' },

  { left: '69%', top: '59%', width: '8.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '78%', top: '61%', width: '8.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '87%', top: '63%', width: '8.5%', rotateY: '0deg', skewY: '0deg' },

  { left: '69%', top: '77%', width: '8.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '78%', top: '79%', width: '8.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '87%', top: '81%', width: '8.5%', rotateY: '0deg', skewY: '0deg' },
];

// Middle bookcase (angled)
const MIDDLE_SHELF_SLOTS: Slot[] = [
  { left: '40%', top: '19.5%', width: '8%', rotateY: '25deg', skewY: '-4deg' },
  { left: '48%', top: '22%', width: '8%', rotateY: '25deg', skewY: '-4deg' },
  { left: '56%', top: '24.5%', width: '8%', rotateY: '25deg', skewY: '-4deg' },
  
  { left: '40%', top: '38%', width: '8%', rotateY: '25deg', skewY: '-4deg' },
  { left: '48%', top: '41%', width: '8%', rotateY: '25deg', skewY: '-4deg' },
  { left: '56%', top: '44%', width: '8%', rotateY: '25deg', skewY: '-4deg' },
];

const INITIAL_SLOTS = [...RIGHT_SHELF_SLOTS, ...MIDDLE_SHELF_SLOTS];

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
