import React, { useState, useRef, useEffect } from 'react';
import boxImg from '../assets/box.png';
import { useLibraryStore, useUIStore } from '../store';
import { BoxConfigModal } from './BoxConfigModal';

interface RowBounds {
  leftTop: number;
  rightTop: number;
}

export interface Slot {
  left: string;
  top: string;
  width: string;
  rotateY: string;
  skewY: string;
  flipImage: boolean;
  baseZ: number;
}

function generateGrid(
  leftEdge: number,
  rightEdge: number,
  cols: number,
  rows: RowBounds[],
  width: string,
  rotateY: string,
  skewY: string,
  flipImage: boolean = false,
  reverseZ: boolean = false
): Slot[] {
  const slots: Slot[] = [];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols; c++) {
      const leftPercent = cols <= 1 ? leftEdge : leftEdge + (rightEdge - leftEdge) * (c / (cols - 1));
      const topPercent = cols <= 1 ? rows[r].leftTop : rows[r].leftTop + (rows[r].rightTop - rows[r].leftTop) * (c / (cols - 1));
      
      const baseZ = reverseZ ? (cols - c) : c;

      slots.push({
        left: `${leftPercent.toFixed(1)}%`,
        top: `${topPercent.toFixed(1)}%`,
        width,
        rotateY,
        skewY,
        flipImage,
        baseZ
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
  '10.5%', '0deg', '0deg', false, false
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
  '10.5%', '25deg', '-4deg', false, false
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
  '10.5%', '-25deg', '4deg', true, true
);

// Generic spawn points on the floor for unarranged boxes
const FLOOR_SLOTS: Slot[] = Array.from({ length: 6 }).map((_, i) => ({
  left: `${40 + i * 5}%`,
  top: '85%',
  width: '10.5%',
  rotateY: '0deg',
  skewY: '0deg',
  flipImage: false,
  baseZ: i
}));

const INITIAL_SLOTS = [...LEFT_SHELF_SLOTS, ...MIDDLE_SHELF_SLOTS, ...RIGHT_SHELF_SLOTS, ...FLOOR_SLOTS];

export interface BoxData {
  id: string;
  label: string;
  rule_type: string;
  rule_value: string;
  slot_idx: number | null;
}

interface ShelfOverlayProps {
  onBoxClick: (box: BoxData) => void;
}

export const ShelfOverlay: React.FC<ShelfOverlayProps> = ({ onBoxClick }) => {
  const { apiPort } = useUIStore();
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Fetch boxes on mount
  const loadBoxes = async () => {
    if (!apiPort) return;
    try {
      const res = await fetch(`http://localhost:${apiPort}/api/boxes`);
      const data: BoxData[] = await res.json();
      setBoxes(data);
      
      const initialAssign: Record<string, number> = {};
      data.forEach(box => {
        if (box.slot_idx !== null && box.slot_idx < INITIAL_SLOTS.length) {
          initialAssign[box.id] = box.slot_idx;
        }
      });
      setAssignments(initialAssign);
    } catch (e) {
      console.error("Failed to load boxes", e);
    }
  };

  useEffect(() => {
    loadBoxes();
  }, [apiPort]);

  const syncAssignments = async (newAssign: Record<string, number>) => {
    if (!apiPort) return;
    try {
      await fetch(`http://localhost:${apiPort}/api/boxes/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssign)
      });
    } catch (e) {
      console.error("Failed to sync assignments", e);
    }
  };

  const handleCreateBox = async (config: { label: string, rule_type: string, rule_value: string }) => {
    if (!apiPort) return;
    
    // Find next available SHELF slot (exclude floor slots so new boxes are visible on shelves)
    const shelfSlotCount = LEFT_SHELF_SLOTS.length + MIDDLE_SHELF_SLOTS.length + RIGHT_SHELF_SLOTS.length;
    const takenSlots = new Set(Object.values(assignments));
    let targetSlot: number | null = null;
    
    for (let i = 0; i < shelfSlotCount; i++) {
      if (!takenSlots.has(i)) {
        targetSlot = i;
        break;
      }
    }
    
    try {
      const res = await fetch(`http://localhost:${apiPort}/api/boxes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, slot_idx: targetSlot })
      });
      if (res.ok) {
        setShowConfigModal(false);
        loadBoxes(); // Reload to get the new box ID and update state
      }
    } catch (e) {
      console.error("Failed to create box", e);
    }
  };
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
    
    // Only snap to shelf slots, not floor slots
    const SHELF_SLOTS_COUNT = INITIAL_SLOTS.length - FLOOR_SLOTS.length;
    
    for (let i = 0; i < SHELF_SLOTS_COUNT; i++) {
      const slot = INITIAL_SLOTS[i];
      const slotX = parseFloat(slot.left);
      const slotY = parseFloat(slot.top);
      const dist = Math.sqrt(Math.pow(xPercent - slotX, 2) + Math.pow(yPercent - slotY, 2));
      
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = i;
      }
    }

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
          
          
          syncAssignments(newAssign);
          return newAssign;
        });
      } else if (mousePos) {
        // If dropped outside shelf, move it back to the floor
        setAssignments(prev => {
          const newAssign = { ...prev };
          const oldSlotIdx = newAssign[draggingBoxId];
          const SHELF_SLOTS_COUNT = INITIAL_SLOTS.length - FLOOR_SLOTS.length;
          
          if (oldSlotIdx !== undefined && oldSlotIdx < SHELF_SLOTS_COUNT) {
            const takenSlots = new Set(Object.values(newAssign));
            let targetSlot = null;
            for (let i = SHELF_SLOTS_COUNT; i < INITIAL_SLOTS.length; i++) {
              if (!takenSlots.has(i)) {
                targetSlot = i;
                break;
              }
            }
            if (targetSlot !== null) {
              newAssign[draggingBoxId] = targetSlot;
              syncAssignments(newAssign);
            }
          }
          return newAssign;
        });
      }
      setDraggingBoxId(null);
      setMousePos(null);
      setHoveredSlotIdx(null);
    }
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
          
          let left, top, width, rotateY, skewY, flipImage, baseZ;
          
          if (isDragging && mousePos) {
            left = `${mousePos.x}%`;
            top = `${mousePos.y}%`;
            // Keep perspective of the closest hovered slot, or fallback to its original slot
            const sourceSlot = hoveredSlotIdx !== null ? INITIAL_SLOTS[hoveredSlotIdx] : (slotIdx !== undefined ? INITIAL_SLOTS[slotIdx] : INITIAL_SLOTS[0]);
            width = sourceSlot.width;
            rotateY = sourceSlot.rotateY;
            skewY = sourceSlot.skewY;
            flipImage = sourceSlot.flipImage;
            baseZ = 1000;
          } else {
            const slot = INITIAL_SLOTS[slotIdx!];
            left = slot.left;
            top = slot.top;
            width = slot.width;
            rotateY = slot.rotateY;
            skewY = slot.skewY;
            flipImage = slot.flipImage;
            baseZ = slot.baseZ;
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
                zIndex: isDragging ? 1000 : baseZ
              }}
            >
              <div className="box-inner">
                <img 
                  src={boxImg} 
                  className="box-image" 
                  alt="Comic Box" 
                  draggable={false} 
                  style={flipImage ? { transform: 'scaleX(-1)' } : undefined} 
                />
              </div>
              <div className="box-tooltip">{box.label}</div>
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
          <button className="hud-btn" onClick={() => setShowConfigModal(true)}>
            📦 Add New Box
          </button>
        )}
      </div>
      
      {showConfigModal && (
        <BoxConfigModal 
          onClose={() => setShowConfigModal(false)}
          onSave={handleCreateBox}
        />
      )}
    </>
  );
};
