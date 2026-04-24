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
  skewY: string,
  flipImage: boolean = false
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
        skewY,
        flipImage
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
  '14.5%', '0deg', '0deg', false
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
  '11.5%', '25deg', '-4deg', false
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
  '11.5%', '-25deg', '4deg', true
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
  // assignments maps box.id to an index in INITIAL_SLOTS
  const [assignments, setAssignments] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    boxes.forEach((box, idx) => {
      if (idx < INITIAL_SLOTS.length) {
        initial[box.id] = idx;
      }
    });
    return initial;
  });

  const [editMode, setEditMode] = useState(false);
  const [draggingBoxId, setDraggingBoxId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredSlotIdx, setHoveredSlotIdx] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent, boxId: string) => {
    if (!editMode) return;
    e.preventDefault();
    setDraggingBoxId(boxId);
    
    // Set initial mouse pos
    if (overlayRef.current) {
      const rect = overlayRef.current.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x: xPercent, y: yPercent });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!editMode || !draggingBoxId || !overlayRef.current) return;
    
    const rect = overlayRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePos({ x: xPercent, y: yPercent });

    // Find closest slot to snap to
    let minDistance = Infinity;
    let closestIdx = -1;
    
    INITIAL_SLOTS.forEach((slot, idx) => {
      const slotX = parseFloat(slot.left);
      const slotY = parseFloat(slot.top);
      const dist = Math.sqrt(Math.pow(xPercent - slotX, 2) + Math.pow(yPercent - slotY, 2));
      
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
    });

    // Snap distance threshold (in percentage)
    if (minDistance < 8) {
      setHoveredSlotIdx(closestIdx);
    } else {
      setHoveredSlotIdx(null);
    }
  };

  const handlePointerUp = () => {
    if (draggingBoxId) {
      if (hoveredSlotIdx !== null) {
        setAssignments(prev => {
          const newAssign = { ...prev };
          // Check if another box is in this slot
          const previousOccupantId = Object.keys(newAssign).find(id => newAssign[id] === hoveredSlotIdx);
          const oldSlotIdx = newAssign[draggingBoxId];
          
          newAssign[draggingBoxId] = hoveredSlotIdx;
          
          // Swap logic
          if (previousOccupantId && previousOccupantId !== draggingBoxId && oldSlotIdx !== undefined) {
             newAssign[previousOccupantId] = oldSlotIdx;
          } else if (previousOccupantId && previousOccupantId !== draggingBoxId) {
             // If the dragged box had no prior slot, just evict the old occupant (remove assignment)
             delete newAssign[previousOccupantId];
          }
          
          return newAssign;
        });
      }
      setDraggingBoxId(null);
      setMousePos(null);
      setHoveredSlotIdx(null);
    }
  };

  const exportCoordinates = () => {
    const json = JSON.stringify(assignments, null, 2);
    navigator.clipboard.writeText(json);
    alert("Box assignments copied to clipboard! Paste them to Antigravity.");
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
        {/* Render Snap Highlight */}
        {editMode && hoveredSlotIdx !== null && (
          <div
            style={{
              position: 'absolute',
              left: INITIAL_SLOTS[hoveredSlotIdx].left,
              top: INITIAL_SLOTS[hoveredSlotIdx].top,
              width: INITIAL_SLOTS[hoveredSlotIdx].width,
              height: '14%', // approximate height of box
              transform: `perspective(1000px) rotateY(${INITIAL_SLOTS[hoveredSlotIdx].rotateY}) skewY(${INITIAL_SLOTS[hoveredSlotIdx].skewY}) translate(-50%, -60%)`,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              border: '2px dashed rgba(255,255,255,0.8)',
              borderRadius: '4px',
              pointerEvents: 'none',
              zIndex: 10
            }}
          />
        )}

        {boxes.map((box) => {
          const slotIdx = assignments[box.id];
          const isDragging = draggingBoxId === box.id;
          
          if (slotIdx === undefined && !isDragging) return null;
          
          let left, top, width, rotateY, skewY, flipImage;
          
          if (isDragging && mousePos) {
            left = `${mousePos.x}%`;
            top = `${mousePos.y}%`;
            // Keep perspective of the closest hovered slot, or fallback to its original slot
            const sourceSlot = hoveredSlotIdx !== null ? INITIAL_SLOTS[hoveredSlotIdx] : (slotIdx !== undefined ? INITIAL_SLOTS[slotIdx] : INITIAL_SLOTS[0]);
            width = sourceSlot.width;
            rotateY = sourceSlot.rotateY;
            skewY = sourceSlot.skewY;
            flipImage = sourceSlot.flipImage;
          } else {
            const slot = INITIAL_SLOTS[slotIdx!];
            left = slot.left;
            top = slot.top;
            width = slot.width;
            rotateY = slot.rotateY;
            skewY = slot.skewY;
            flipImage = slot.flipImage;
          }
          
          return (
            <div 
              key={box.id} 
              className="shelf-box"
              onPointerDown={(e) => handlePointerDown(e, box.id)}
              onClick={() => !editMode && onBoxClick(box)}
              style={{
                left,
                top,
                width,
                transform: `perspective(1000px) rotateY(${rotateY}) skewY(${skewY}) translate(-50%, -60%)`,
                cursor: editMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
                transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                zIndex: isDragging ? 1000 : undefined
              }}
            >
              <div className="box-inner" style={flipImage ? { transform: 'scaleX(-1)' } : undefined}>
                <img src={boxImg} className="box-image" alt="Comic Box" draggable={false} />
                <div className="box-label">
                  <span style={flipImage ? { transform: 'scaleX(-1)', display: 'block' } : undefined}>{box.label}</span>
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
