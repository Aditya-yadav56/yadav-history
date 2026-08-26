'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

type Article = {
  id: string;
  title: string;
  image_url: string;
  category: string;
};

export default function CardFan() {
  const [cards, setCards] = useState<Article[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    async function fetchCards() {
      const { data } = await supabase
        .from('articles')
        .select('id, title, image_url, category')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5); // Best with 5 cards for a fan
      
      if (data) setCards(data);
    }
    fetchCards();
  }, []);

  useEffect(() => {
    if (cards.length === 0) return;

    let ctx = gsap.context(() => {
      // Calculate spread based on number of cards
      const total = cards.length;
      
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        
        // Map 0 -> total-1 to a range from -1 to 1
        const normalized = (i - (total - 1) / 2) / ((total - 1) / 2 || 1);
        
        // Initial fan animation
        gsap.fromTo(card,
          {
            y: 400,
            rotation: 0,
            scale: 0.8,
            opacity: 0,
          },
          {
            y: Math.abs(normalized) * 20, // slightly lower on the edges
            x: normalized * 180, // spread horizontally
            rotation: normalized * 15, // fan rotation
            scale: 1,
            opacity: 1,
            duration: 1.2,
            ease: "back.out(1.2)",
            delay: i * 0.1,
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reset'
            }
          }
        );

        // Hover interactions
        let leaveTimeout: NodeJS.Timeout;

        card.addEventListener("mouseenter", () => {
          clearTimeout(leaveTimeout);
          
          // Instantly pop to front
          gsap.set(card, { zIndex: 50 });
          
          gsap.to(card, {
            y: -60,
            scale: 1.15,
            rotation: 0,
            filter: "grayscale(0%) brightness(1)",
            duration: 0.4,
            ease: "power3.out",
            overwrite: "auto"
          });
          
          // Push others away and dim them
          cardsRef.current.forEach((otherCard, j) => {
            if (otherCard && otherCard !== card) {
              const otherNorm = (j - (total - 1) / 2) / ((total - 1) / 2 || 1);
              const pushDir = j < i ? -1 : 1;
              
              // Keep their natural z-index
              gsap.set(otherCard, { zIndex: j });
              
              gsap.to(otherCard, {
                x: (otherNorm * 180) + (pushDir * 60), // Pushed further
                y: Math.abs(otherNorm) * 20 + 20,
                rotation: otherNorm * 15 + (pushDir * 8),
                filter: "grayscale(100%) brightness(0.4)",
                duration: 0.4,
                ease: "power3.out",
                overwrite: "auto"
              });
            }
          });
        });

        card.addEventListener("mouseleave", () => {
          leaveTimeout = setTimeout(() => {
            cardsRef.current.forEach((otherCard, j) => {
              if (otherCard) {
                const otherNorm = (j - (total - 1) / 2) / ((total - 1) / 2 || 1);
                
                gsap.to(otherCard, {
                  y: Math.abs(otherNorm) * 20,
                  x: otherNorm * 180,
                  rotation: otherNorm * 15,
                  scale: 1,
                  filter: "grayscale(100%) brightness(1)",
                  duration: 0.5,
                  ease: "power2.out",
                  overwrite: "auto",
                  onComplete: () => {
                    // Restore natural z-index only after it has finished shrinking
                    gsap.set(otherCard, { zIndex: j });
                  }
                });
              }
            });
          }, 80); // slightly longer debounce
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [cards]);

  if (cards.length === 0) return null;

  return (
    <section className="relative w-full h-[70vh] bg-[#ebe6e0] border-t-2 border-black overflow-hidden flex flex-col items-center justify-center">
      
      {/* Background typography */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <h2 className="text-[20vw] font-black uppercase tracking-tighter leading-none text-black">Pick a Card</h2>
      </div>

      <div className="text-center mb-12 z-10">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">
          Featured Hand
        </h2>
        <p className="text-sm font-black uppercase tracking-widest text-gray-500">
          Pick your next read
        </p>
      </div>

      <div ref={containerRef} className="relative w-full max-w-4xl h-[400px] flex items-end justify-center perspective-[1000px]">
        {cards.map((article, i) => (
          <Link
            key={article.id}
            href={`/articles/${article.id}`}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="absolute bottom-0 w-[240px] h-[340px] bg-white border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-shadow hover:shadow-[16px_16px_0px_rgba(0,0,0,1)] flex flex-col cursor-pointer transform-origin-bottom"
            style={{ 
              transformOrigin: 'bottom center',
              zIndex: i 
            }}
          >
            {/* Image */}
            <div className="h-40 border-b-2 border-black relative overflow-hidden bg-gray-100">
              <img 
                src={article.image_url} 
                alt={article.title}
                className="w-full h-full object-cover grayscale"
              />
              <div className="absolute top-2 left-2 bg-black text-white text-[9px] font-black uppercase tracking-widest px-2 py-1">
                {article.category}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col justify-between bg-white">
              <h3 className="font-black text-lg uppercase tracking-tight text-black leading-tight line-clamp-3">
                {article.title}
              </h3>
              
              <div className="flex justify-between items-end mt-4">
                <span className="text-black font-black uppercase tracking-widest text-xs">Read</span>
                <span className="text-black font-black text-xl leading-none">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
