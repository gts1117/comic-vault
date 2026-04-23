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
  { left: '68%', top: '15.5%', width: '10.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '79%', top: '15.5%', width: '10.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '90%', top: '15.5%', width: '10.5%', rotateY: '0deg', skewY: '0deg' },
  
  { left: '68%', top: '28%', width: '10.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '79%', top: '28%', width: '10.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '90%', top: '28%', width: '10.5%', rotateY: '0deg', skewY: '0deg' },

  { left: '68%', top: '40.5%', width: '10.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '79%', top: '40.5%', width: '10.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '90%', top: '40.5%', width: '10.5%', rotateY: '0deg', skewY: '0deg' },

  { left: '68%', top: '53.5%', width: '10.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '79%', top: '53.5%', width: '10.5%', rotateY: '0deg', skewY: '0deg' },
  { left: '90%', top: '53.5%', width: '10.5%', rotateY: '0deg', skewY: '0deg' },
];

// Left bookcase (angled)
const LEFT_SHELF_SLOTS: Slot[] = [
  { left: '41%', top: '18%', width: '11%', rotateY: '25deg', skewY: '-10deg' },
  { left: '52%', top: '16.5%', width: '11%', rotateY: '20deg', skewY: '-5deg' },
  
  { left: '41%', top: '30%', width: '11%', rotateY: '25deg', skewY: '-10deg' },
  { left: '52%', top: '28.5%', width: '11%', rotateY: '20deg', skewY: '-5deg' },

  { left: '41%', top: '43%', width: '11%', rotateY: '25deg', skewY: '-10deg' },
  { left: '52%', top: '41.5%', width: '11%', rotateY: '20deg', skewY: '-5deg' },
];

const ALL_SLOTS = [...RIGHT_SHELF_SLOTS, ...LEFT_SHELF_SLOTS];

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
