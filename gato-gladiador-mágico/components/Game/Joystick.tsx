'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove, onEnd }) => {
  const [touchPoint, setTouchPoint] = useState<{x: number, y: number} | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleStart = (e: TouchEvent | MouseEvent) => {
      let clientX, clientY;
      if (e instanceof TouchEvent) {
        if (e.touches[0].clientX > window.innerWidth / 2) return; // Only left side
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        if ((e as MouseEvent).clientX > window.innerWidth / 2) return;
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }
      setTouchPoint({ x: clientX, y: clientY });
      setIsDragging(true);
    };

    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!isDragging || !touchPoint) return;

      let clientX, clientY;
      if (e instanceof TouchEvent) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const dx = clientX - touchPoint.x;
      const dy = clientY - touchPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 60;

      let finalX = dx;
      let finalY = dy;

      if (distance > maxDistance) {
        finalX = (dx / distance) * maxDistance;
        finalY = (dy / distance) * maxDistance;
      }

      setPosition({ x: finalX, y: finalY });
      onMove(finalX / maxDistance, finalY / maxDistance);
    };

    const handleEnd = () => {
      setIsDragging(false);
      setTouchPoint(null);
      setPosition({ x: 0, y: 0 });
      onEnd();
    };

    window.addEventListener('mousedown', handleStart);
    window.addEventListener('touchstart', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousedown', handleStart);
      window.removeEventListener('touchstart', handleStart);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, touchPoint, onMove, onEnd]);

  if (!touchPoint) return null;

  return (
    <div 
      style={{ left: touchPoint.x, top: touchPoint.y, transform: 'translate(-50%, -50%)' }}
      className="fixed z-[100] w-32 h-32 rounded-full bg-white/5 border-2 border-white/20 flex items-center justify-center pointer-events-none"
    >
      <motion.div 
        animate={{ x: position.x, y: position.y }}
        transition={{ type: 'spring', damping: 10, stiffness: 200 }}
        className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 shadow-xl"
      />
    </div>
  );
};
