'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

type Article = {
  id: string;
  title: string;
  content: string;
  language: string;
  category: string;
  image_url: string;
};

export default function YadavKingsPage() {
  const [activeLanguage, setActiveLanguage] = useState('English');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('status', 'approved')
        .eq('category', 'Yadav Kings')
        .eq('language', activeLanguage);

      if (data && data.length > 0) {
        setArticles(data);
      } else {
        // Dummy data for testing UI
        setArticles([
          { id: 'dummy1', title: 'The Mighty Seunas', content: 'The rise of the Seuna dynasty...', category: 'Yadav Kings', image_url: 'https://images.unsplash.com/photo-1599557626941-0f73f2fb7c34?w=800', language: activeLanguage },
          { id: 'dummy2', title: 'Bhillama V', content: 'Established the capital at Devagiri...', category: 'Yadav Kings', image_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800', language: activeLanguage },
        ]);
      }
      setLoading(false);
    }
    fetchArticles();
  }, [activeLanguage]);

  useGSAP(() => {
    if (loading) return;
    
    gsap.fromTo('.article-card',
      { y: 50, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.6, stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        }
      }
    );
  }, { scope: containerRef, dependencies: [articles, loading] });

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 py-12 w-full min-h-screen">
      <h1 className="text-5xl md:text-7xl font-black text-black text-center mb-12 uppercase tracking-tighter">
        Yadav Kings
      </h1>
      
      {/* Language Tabs */}
      <div className="flex justify-center gap-4 mb-16">
        {['English', 'Hindi', 'Telugu'].map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveLanguage(lang)}
            className={`px-8 py-2 font-black border-2 border-black uppercase tracking-widest transition-colors ${
              activeLanguage === lang 
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-xl font-bold uppercase tracking-widest text-black animate-pulse">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Link href={`/articles/${article.id}`} key={article.id} className="article-card group bg-white border-2 border-black flex flex-col cursor-pointer hover:bg-gray-50 transition-colors">
              {article.image_url ? (
                <div className="relative h-56 border-b-2 border-black overflow-hidden bg-gray-200">
                  <img src={article.image_url} alt={article.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-700" />
                </div>
              ) : (
                <div className="h-56 border-b-2 border-black bg-gray-200 flex items-center justify-center">
                  <span className="font-bold text-gray-400 uppercase tracking-widest">No Image</span>
                </div>
              )}
              <div className="p-6 flex flex-col flex-grow">
                <div className="text-xs font-black text-black mb-3 uppercase tracking-widest border border-black inline-block px-2 py-1 self-start">
                  {article.category}
                </div>
                <h3 className="text-2xl font-black text-black mb-4 leading-tight tracking-tight group-hover:underline underline-offset-4 decoration-4">
                  {article.title}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                  {article.content}
                </p>
                <div className="mt-auto">
                  <span className="text-black font-black uppercase tracking-widest text-sm border-b-2 border-black pb-1 group-hover:border-transparent transition-colors">
                    Read More →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
