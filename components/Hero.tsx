'use client';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Link from 'next/link';

const letters = ['Y', 'A', 'D', 'A', 'V'];

export default function Hero() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.2 });

    tl.fromTo('.hero-letter',
      { y: -150, opacity: 0, rotateX: -90, transformPerspective: 800 },
      {
        y: 0, opacity: 1, rotateX: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: 'back.out(1.7)',
      }
    )
    .fromTo('.hero-tagline',
      { opacity: 0, y: 30, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' },
      '-=0.2'
    )
    .fromTo('.hero-desc',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.4'
    )
    .fromTo('.hero-scroll',
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.5 },
      '-=0.2'
    );
  }, { scope: container });

  return (
    <section
      ref={container}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden p-4 sm:p-6 md:p-8"
      style={{ background: 'radial-gradient(ellipse at 60% 40%, #ece8e4 0%, #dedad7 60%)' }}
    >
      {/* Decorative Frame */}
      <div className="absolute inset-4 sm:inset-6 md:inset-8 border border-black rounded-[0.5rem] sm:rounded-[1rem] pointer-events-none flex flex-col justify-between p-6 sm:p-8 md:p-10 z-10">
        <div className="flex justify-between items-start text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-[0.2em] pointer-events-auto">
          <span>Est. 2026</span>
          <Link href="/contribute" className="hover:text-black transition-colors">Contribute</Link>
        </div>
        <div className="flex justify-between items-end text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-[0.2em] pointer-events-auto">
          <span className="invisible sm:visible">Yadav History</span>
          <span>Archive</span>
        </div>
      </div>
      
      {/* Faint background "INDIA" watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[20vw] font-black text-black/[0.03] tracking-widest uppercase whitespace-nowrap">INDIA</span>
      </div>

      {/* YADAV Letters */}
      <div className="hero-letter-group flex items-center gap-1 sm:gap-2 md:gap-4">
        {letters.map((letter, i) => (
          <span
            key={i}
            className="hero-letter font-black text-black text-3d select-none leading-none"
            style={{ fontSize: 'clamp(4rem, 16vw, 14rem)' }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Divider line */}
      <div className="w-32 h-1 bg-black/20 rounded-full mt-6 mb-6" />

      {/* Tagline */}
      <p className="hero-tagline text-center text-base sm:text-xl md:text-2xl font-bold text-gray-700 tracking-[0.25em] uppercase">
        India&apos;s Living History
      </p>
      <p className="hero-desc text-center text-sm text-gray-500 mt-3 max-w-md px-4 leading-relaxed">
        Discover the legacy of Yadav Kings, historical places, and ancient timelines — curated for every generation.
      </p>

      {/* Scroll indicator */}
      <div className="hero-scroll absolute bottom-10 flex flex-col items-center gap-2 text-gray-400">
        <span className="text-[10px] font-black tracking-[0.4em] uppercase">Scroll</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
