'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import gsap from 'gsap';

type Option = { value: string; label: string };

type Props = {
  value: string;
  options: Option[];
  onChange: (val: string) => void;
  /** 'underline' = form-field style (border-b only) | 'box' = full-border box style */
  variant?: 'underline' | 'box';
  className?: string;
};

export default function CustomSelect({ value, options, onChange, variant = 'underline', className = '' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // GSAP open animation
  useEffect(() => {
    if (isOpen && menuRef.current) {
      gsap.fromTo(
        menuRef.current,
        { opacity: 0, y: -8, scaleY: 0.85 },
        { opacity: 1, y: 0, scaleY: 1, duration: 0.2, ease: 'power3.out', transformOrigin: 'top center' }
      );
    }
  }, [isOpen]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  const triggerClass =
    variant === 'underline'
      ? `w-full flex items-center justify-between py-2 border-b-2 border-gray-300 hover:border-black bg-transparent focus:outline-none transition-colors font-bold text-sm cursor-pointer group ${className}`
      : `flex items-center gap-3 border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors cursor-pointer ${className}`;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
            variant === 'underline' ? 'text-gray-400 group-hover:text-black' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          className="absolute left-0 z-50 w-full min-w-max mt-1 bg-white border-2 border-black divide-y divide-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors ${
                opt.value === value ? 'bg-gray-100 text-black' : 'text-black'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
