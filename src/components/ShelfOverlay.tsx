import React from 'react';
import boxImg from '../assets/box.png';

interface Slot {
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

const ALL_SLOTS = [...RIGHT_SHELF_SLOTS, ...MIDDLE_SHELF_SLOTS];

interface BoxData {
  id: string;
  label: string;
}

interface ShelfOverlayProps {
  boxes: BoxData[];
  onBoxClick: (box: BoxData) => void;
}

export const ShelfOverlay: React.FC<ShelfOverlayProps> = ({ boxes, onBoxClick }) => {
  return (
    <div className="shelf-overlay">
      {boxes.map((box, idx) => {
        if (idx >= ALL_SLOTS.length) return null; // Pagination could be added here
        
        const slot = ALL_SLOTS[idx];
        
        return (
          <div 
            key={box.id} 
            className="shelf-box"
            onClick={() => onBoxClick(box)}
            style={{
              left: slot.left,
              top: slot.top,
              width: slot.width,
              transform: `perspective(1000px) rotateY(${slot.rotateY}) skewY(${slot.skewY})`
            }}
          >
            <div className="box-inner">
              <img src={boxImg} className="box-image" alt="Comic Box" />
              <div className="box-label">
                <span>{box.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
