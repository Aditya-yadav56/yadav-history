'use client';
import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function CustomScrollbar() {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Track Scroll Position
  useEffect(() => {
    const handleScroll = () => {
      if (isDragging) return;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const pct = window.scrollY / totalHeight;
        setScrollPercent(pct);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDragging]);

  // 2. Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartScrollTop.current = window.scrollY;
    document.body.classList.add('select-none', 'cursor-grabbing');
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartY.current;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const trackHeight = window.innerHeight - 80; // margins
      const scrollAmount = (deltaY / trackHeight) * document.documentElement.scrollHeight;
      
      window.scrollTo(0, dragStartScrollTop.current + scrollAmount);
      
      const newPct = Math.min(Math.max(window.scrollY / totalHeight, 0), 1);
      setScrollPercent(newPct);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.classList.remove('select-none', 'cursor-grabbing');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // 3. GSAP Animations for hover/active states
  useGSAP(() => {
    if (isHovered || isDragging) {
      // Expand scrollbar thumb and show percentage tooltip
      gsap.to(thumbRef.current, {
        width: 14,
        x: -4,
        backgroundColor: '#000000',
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(tooltipRef.current, {
        opacity: 1,
        x: -12,
        scale: 1,
        duration: 0.3,
        ease: 'back.out(1.7)',
      });
    } else {
      // Contract scrollbar thumb and hide percentage tooltip
      gsap.to(thumbRef.current, {
        width: 6,
        x: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(tooltipRef.current, {
        opacity: 0,
        x: 10,
        scale: 0.8,
        duration: 0.3,
        ease: 'power2.in',
      });
    }
  }, { scope: containerRef, dependencies: [isHovered, isDragging] });

  if (!mounted) return null;

  // Update thumb position based on scroll percent
  const trackHeight = typeof window !== 'undefined' ? window.innerHeight - 80 : 500;
  const thumbHeight = 64; // height in px
  const maxThumbY = trackHeight - thumbHeight;
  const thumbY = scrollPercent * maxThumbY;

  return (
    <div 
      ref={containerRef}
      className="fixed right-0 top-0 h-screen w-8 z-[9999] flex items-center justify-center pointer-events-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible Hover Zone (takes pointer events to trigger expand) */}
      <div className="absolute inset-y-0 right-0 w-8 pointer-events-auto cursor-pointer" />

      {/* Visual Track */}
      <div 
        ref={trackRef}
        className="absolute top-10 bottom-10 right-2 w-[2px] bg-black/10 pointer-events-none"
      />

      {/* Thumb Container (absolute positioning for custom scrollbar) */}
      <div 
        className="absolute right-2 top-10 pointer-events-auto"
        style={{ 
          height: trackHeight, 
          width: 24, 
          transform: 'translateX(50%)' 
        }}
      >
        {/* Scrollbar Thumb */}
        <div
          ref={thumbRef}
          onMouseDown={handleMouseDown}
          className="absolute right-3 rounded-none border border-black/30 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center gap-0.5"
          style={{
            top: thumbY,
            height: thumbHeight,
            width: 6,
          }}
        >
          {/* Brutalist grip lines (only visible when expanded) */}
          {(isHovered || isDragging) && (
            <>
              <div className="w-1.5 h-[1px] bg-white/50" />
              <div className="w-1.5 h-[1px] bg-white/50" />
              <div className="w-1.5 h-[1px] bg-white/50" />
            </>
          )}
        </div>

        {/* Floating Tooltip Percentage Label */}
        <button
          ref={tooltipRef}
          className="absolute right-8 bg-black text-[#dedad7] px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-none border border-black select-none pointer-events-none flex items-center gap-1.5"
          style={{
            top: thumbY + 16,
            opacity: 0,
            transform: 'translateX(0px)',
          }}
        >
          <span>{Math.round(scrollPercent * 100)}%</span>
          <span className="text-[7px] text-gray-400">READ</span>
        </button>
      </div>
    </div>
  );
}
