'use client';
import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { supabase } from '@/lib/supabase';
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

const categoryStyles: Record<string, string> = {
  'Yadav Kings':       'bg-black text-white border border-black',
  'Historical Places': 'bg-white text-black border border-black',
  'Culture & Art':     'bg-black text-white border border-black',
  'Other':             'bg-white text-black border border-black',
};

// Grid placement for each card
const gridSpans = [
  'md:col-span-2 md:row-span-2', // hero card
  'md:col-span-1 md:row-span-1',
  'md:col-span-1 md:row-span-1',
  'md:col-span-1 md:row-span-2',
  'md:col-span-2 md:row-span-1',
  'md:col-span-1 md:row-span-1',
];

export default function BentoSection() {
  const container = useRef<HTMLDivElement>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('articles')
      .select('id, title, content, category, image_url, language')
      .eq('status', 'approved')
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setArticles(data);
        } else {
          setArticles([
            { id: 'dummy1', title: 'The Great Kings of Yadava', content: 'Explore the vast empire...', category: 'Yadav Kings', image_url: 'https://images.unsplash.com/photo-1599557626941-0f73f2fb7c34?w=800', language: 'English' },
            { id: 'dummy2', title: 'Architecture of Devagiri', content: 'The impregnable fort...', category: 'Historical Places', image_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800', language: 'English' },
            { id: 'dummy3', title: 'Art & Literature', content: 'Patronage of Marathi...', category: 'Culture & Art', image_url: 'https://images.unsplash.com/photo-1623869680517-578c7923485b?w=800', language: 'English' },
            { id: 'dummy4', title: 'Wars & Conquests', content: 'The battles fought...', category: 'Yadav Kings', image_url: 'https://images.unsplash.com/photo-1599557626941-0f73f2fb7c34?w=800', language: 'English' },
            { id: 'dummy5', title: 'Daily Life', content: 'What life was like...', category: 'Culture & Art', image_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800', language: 'English' },
            { id: 'dummy6', title: 'Legacy', content: 'The lasting impact...', category: 'Other', image_url: 'https://images.unsplash.com/photo-1623869680517-578c7923485b?w=800', language: 'English' },
          ]);
        }
        setLoading(false);
      });
  }, []);

  useGSAP(() => {
    if (loading) return;

    gsap.utils.toArray<HTMLElement>('.bento-card').forEach((card) => {
      const textEl = card.querySelector<HTMLElement>('.bento-text');
      const imgEl  = card.querySelector<HTMLElement>('.bento-img');

      if (textEl) {
        gsap.fromTo(textEl,
          { filter: 'blur(14px)', opacity: 0, y: 24 },
          {
            filter: 'blur(0px)', opacity: 1, y: 0,
            duration: 0.8,
            scrollTrigger: { trigger: card, start: 'top 82%', end: 'top 45%', scrub: 0.9 },
          }
        );
      }
      if (imgEl) {
        gsap.fromTo(imgEl,
          { scale: 1.12, opacity: 0, filter: 'blur(10px)' },
          {
            scale: 1, opacity: 1, filter: 'blur(0px)',
            scrollTrigger: { trigger: card, start: 'top 95%', end: 'top 20%', scrub: 1.2 },
          }
        );
      }
    });
  }, { scope: container, dependencies: [articles, loading] });

  return (
    <section ref={container} className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-12">
        <h2 className="text-5xl md:text-6xl font-black text-black text-3d leading-none">Featured</h2>
        <p className="text-gray-500 text-lg mt-3 font-medium">The latest from our curated archive</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-3 gap-4" style={{ height: 720 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`bg-gray-200 border-2 border-black rounded-none animate-pulse ${gridSpans[i]}`} />
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          style={{ gridAutoRows: '200px' }}
        >
          {articles.slice(0, 6).map((article, idx) => (
            <Link
              href={`/articles/${article.id}`}
              key={article.id}
              className={`bento-card relative overflow-hidden rounded-none border-2 border-black cursor-pointer group ${gridSpans[idx] ?? ''}`}
            >
              {/* Image */}
              <div className="bento-img absolute inset-0">
                {article.image_url ? (
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center font-black uppercase tracking-widest text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Hover tint (no red, just a slight darkening) */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />

              {/* Text */}
              <div className="bento-text absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex flex-col items-start">
                <span
                  className={`inline-block text-[10px] font-black px-3 py-1 rounded-none mb-3 uppercase tracking-widest ${categoryStyles[article.category] ?? 'bg-black text-white'}`}
                >
                  {article.category}
                </span>
                <h3 className="text-white font-black leading-snug line-clamp-3 uppercase tracking-tighter"
                  style={{ fontSize: idx === 0 ? '2rem' : '1.25rem' }}>
                  {article.title}
                </h3>
                {idx === 0 && (
                  <p className="text-white/80 font-medium text-sm mt-3 line-clamp-2">{article.content}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
