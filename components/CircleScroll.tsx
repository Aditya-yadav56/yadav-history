'use client';
import { useRef, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

type Article = {
  id: string;
  title: string;
  category: string;
  image_url: string;
};

const RADIUS = 240;

export default function CircleScroll() {
  const sectionRef  = useRef<HTMLElement>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading]   = useState(true);
  const [hovered, setHovered]   = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('articles')
      .select('id, title, category, image_url')
      .eq('status', 'approved')
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setArticles(data);
        } else {
          setArticles([
            { id: 'dummy1', title: 'The Great Kings of Yadava', category: 'Yadav Kings', image_url: 'https://images.unsplash.com/photo-1599557626941-0f73f2fb7c34?w=800' },
            { id: 'dummy2', title: 'Architecture of Devagiri', category: 'Historical Places', image_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800' },
            { id: 'dummy3', title: 'Art & Literature', category: 'Culture & Art', image_url: 'https://images.unsplash.com/photo-1623869680517-578c7923485b?w=800' },
            { id: 'dummy4', title: 'Wars & Conquests', category: 'Yadav Kings', image_url: 'https://images.unsplash.com/photo-1599557626941-0f73f2fb7c34?w=800' },
            { id: 'dummy5', title: 'Daily Life', category: 'Culture & Art', image_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800' },
            { id: 'dummy6', title: 'Legacy', category: 'Other', image_url: 'https://images.unsplash.com/photo-1623869680517-578c7923485b?w=800' },
          ]);
        }
        setLoading(false);
      });
  }, []);

  useGSAP(() => {
    if (loading) return;

    // Section heading
    gsap.fromTo('.circle-heading',
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.8,
        scrollTrigger: { 
          trigger: sectionRef.current, 
          start: 'top 75%',
          toggleActions: 'play none none reset'
        },
      }
    );

    // Cards orbit in
    gsap.fromTo('.orbit-card',
      { opacity: 0, scale: 0.6 },
      {
        opacity: 1, scale: 1, duration: 0.6,
        stagger: 0.08,
        ease: 'back.out(1.4)',
        scrollTrigger: { 
          trigger: sectionRef.current, 
          start: 'top 65%',
          toggleActions: 'play none none reset'
        },
      }
    );

    // Center pulse
    gsap.to('.center-pulse', {
      scale: 1.08,
      duration: 1.8,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    // Slow perpetual orbit rotation
    gsap.to('.orbit-ring', {
      rotation: 360,
      duration: 40,
      repeat: -1,
      ease: 'none',
      transformOrigin: 'center center',
    });
  }, { scope: sectionRef, dependencies: [articles, loading] });

  const angleStep = articles.length > 0 ? 360 / articles.length : 60;

  return (
    <section ref={sectionRef} className="py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Heading */}
        <div className="circle-heading mb-16 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-5xl md:text-6xl font-black text-black text-3d leading-none">From the Archive</h2>
            <p className="text-gray-500 text-lg mt-3 font-medium">Explore every corner of our history</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 font-bold animate-pulse">Loading archive...</div>
        ) : (
          <>
            {/* ── Desktop: Orbital ring ── */}
            <div className="hidden md:flex items-center justify-center" style={{ height: 600 }}>
              <div className="relative" style={{ width: RADIUS * 2 + 160, height: RADIUS * 2 + 160 }}>

                {/* Dashed orbit circle (rotates slowly) */}
                <div
                  className="orbit-ring absolute rounded-full border-2 border-dashed border-black/25 pointer-events-none"
                  style={{
                    width:  RADIUS * 2,
                    height: RADIUS * 2,
                    top:    80,
                    left:   80,
                  }}
                />

                {/* Center circle */}
                <div
                  className="center-pulse absolute z-10 rounded-full bg-black flex flex-col items-center justify-center text-white text-center cursor-default select-none"
                  style={{
                    width:  140,
                    height: 140,
                    top:    RADIUS + 80 - 70,
                    left:   RADIUS + 80 - 70,
                  }}
                >
                  <span className="font-black text-lg leading-tight">Explore</span>
                  <span className="font-bold text-xs opacity-80 mt-0.5">History</span>
                </div>

                {/* Article cards around ring */}
                {articles.map((article, idx) => {
                  const deg = angleStep * idx - 90;
                  const rad = (deg * Math.PI) / 180;
                  const cx  = Math.cos(rad) * RADIUS + RADIUS + 80 - 64;
                  const cy  = Math.sin(rad) * RADIUS + RADIUS + 80 - 56;
                  const isHov = hovered === idx;
                  return (
                    <div
                      key={article.id}
                      className="orbit-card absolute cursor-pointer group"
                      style={{ width: 128, height: 112, top: cy, left: cx }}
                      onMouseEnter={() => setHovered(idx)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div
                        className="rounded-2xl overflow-hidden transition-all duration-300 h-full"
                        style={{
                          transform: isHov ? 'scale(1.18)' : 'scale(1)',
                          outline: isHov ? '3px solid black' : 'none',
                        }}
                      >
                        {article.image_url ? (
                          <img src={article.image_url} alt={article.title} className="w-full h-16 object-cover" />
                        ) : (
                          <div className="w-full h-16 bg-gradient-to-br from-gray-100 to-gray-200" />
                        )}
                        <div className="bg-white px-2.5 py-2 h-[48px]">
                          <p className="text-[9px] font-black text-black uppercase tracking-wide truncate">{article.category}</p>
                          <p className="text-[11px] font-bold leading-tight line-clamp-2 mt-0.5">{article.title}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Preview of hovered article */}
                {hovered !== null && articles[hovered] && (
                  <div className="absolute z-20 pointer-events-none"
                    style={{
                      top:   RADIUS + 80 - 70,
                      left:  RADIUS + 80 + 90,
                      width: 240,
                    }}
                  >
                    <div className="bg-white rounded-2xl p-4 border-l-4 border-black border border-gray-100">
                      <p className="text-xs font-black text-black uppercase tracking-widest mb-1">{articles[hovered].category}</p>
                      <p className="font-black text-sm leading-tight">{articles[hovered].title}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Mobile: 2-column grid fallback ── */}
            <div className="md:hidden grid grid-cols-2 gap-4">
              {articles.map((article) => (
                <div key={article.id} className="orbit-card rounded-2xl overflow-hidden cursor-pointer group border border-gray-100">
                  {article.image_url ? (
                    <img src={article.image_url} alt={article.title} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}
                  <div className="bg-white p-3">
                    <p className="text-xs font-black text-black uppercase">{article.category}</p>
                    <p className="text-sm font-bold line-clamp-2 mt-0.5">{article.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
