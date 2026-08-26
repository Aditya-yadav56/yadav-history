'use client';
import { useRef, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

type Article = {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string;
  language: string;
};

const languageFlag: Record<string, string> = {
  English: '🇬🇧',
  Hindi:   '🇮🇳',
  Telugu:  '🏛️',
};

export default function ArticleCarousel() {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [articles, setArticles]           = useState<Article[]>([]);
  const [loading, setLoading]             = useState(true);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    supabase
      .from('articles')
      .select('id, title, content, category, image_url, language')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setArticles(data);
        } else {
          setArticles([
            { id: 'dummy1', title: 'The Great Kings of Yadava', content: 'Explore the vast empire...', category: 'Yadav Kings', image_url: 'https://images.unsplash.com/photo-1599557626941-0f73f2fb7c34?w=800', language: 'English' },
            { id: 'dummy2', title: 'Architecture of Devagiri', content: 'The impregnable fort...', category: 'Historical Places', image_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800', language: 'English' },
            { id: 'dummy3', title: 'Art & Literature', content: 'Patronage of Marathi...', category: 'Culture & Art', image_url: 'https://images.unsplash.com/photo-1623869680517-578c7923485b?w=800', language: 'English' },
            { id: 'dummy4', title: 'Wars & Conquests', content: 'The battles fought...', category: 'Yadav Kings', image_url: 'https://images.unsplash.com/photo-1599557626941-0f73f2fb7c34?w=800', language: 'English' },
          ]);
        }
        setLoading(false);
      });
  }, []);

  useGSAP(() => {
    if (loading) return;

    gsap.fromTo('.carousel-heading',
      { x: -60, opacity: 0 },
      {
        x: 0, opacity: 1, duration: 0.8,
        scrollTrigger: { 
          trigger: sectionRef.current, 
          start: 'top 80%',
          toggleActions: 'play none none reset'
        },
      }
    );

    gsap.fromTo('.carousel-card',
      { y: 80, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { 
          trigger: sectionRef.current, 
          start: 'top 70%',
          toggleActions: 'play none none reset'
        },
      }
    );
  }, { scope: sectionRef, dependencies: [loading] });

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  return (
    <section ref={sectionRef} className="py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="carousel-heading">
          <h2 className="text-5xl md:text-6xl font-black text-black text-3d leading-none">More Stories</h2>
          <p className="text-gray-500 text-lg mt-3 font-medium">Swipe through our archive</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => scroll('left')} disabled={!canScrollLeft}
            className="w-12 h-12 bg-white rounded-none border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')} disabled={!canScrollRight}
            className="w-12 h-12 bg-white rounded-none border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carousel track */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingLeft: 'max(1rem, calc((100vw - 80rem) / 2))',
          paddingRight: 'max(1rem, calc((100vw - 80rem) / 2))',
        }}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-none w-72 h-[420px] bg-gray-200 border-2 border-black rounded-none animate-pulse snap-center" />
            ))
          : articles.map((article, idx) => (
              <Link
                href={`/articles/${article.id}`}
                key={article.id}
                className="carousel-card flex-none w-72 snap-center group cursor-pointer"
              >
                <div className="relative h-[420px] rounded-none border-2 border-black overflow-hidden transition-transform duration-300 group-hover:-translate-y-2">
                  {/* Image */}
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-700"
                    />
                  ) : (
                    <div
                      className="w-full h-full bg-gray-200 flex items-center justify-center font-black uppercase tracking-widest text-gray-400"
                    >
                      No Image
                    </div>
                  )}

                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Top badge */}
                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] font-black bg-black text-white border border-white px-3 py-1.5 rounded-none uppercase tracking-widest">
                      {languageFlag[article.language] ?? ''} {article.language}
                    </span>
                  </div>

                  {/* Bottom content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest mb-2 border border-gray-500 inline-block px-2 py-1">{article.category}</p>
                    <h3 className="text-white font-black text-xl leading-tight line-clamp-3 mt-2">{article.title}</h3>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="h-px flex-1 bg-white/30" />
                      <span className="text-white text-[10px] font-black uppercase tracking-widest border-b border-white pb-0.5">Read More</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
