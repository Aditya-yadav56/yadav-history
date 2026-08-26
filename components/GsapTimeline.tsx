'use client';
import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { supabase } from '@/lib/supabase';

gsap.registerPlugin(ScrollTrigger);

type TimelineEvent = {
  id: string;
  year: string;
  title: string;
  description: string;
  image_url: string;
};

export default function GsapTimeline() {
  const container = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('timeline_events')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setEvents(data);
        } else {
          setEvents([
            { id: 'dummy1', year: '3000 BCE', title: 'The Ancient Roots', description: 'Early references and the mythological origins in the epic era.', image_url: 'https://images.unsplash.com/photo-1599557626941-0f73f2fb7c34?q=80&w=800&auto=format&fit=crop' },
            { id: 'dummy2', year: '12th Century', title: 'Seuna (Yadava) Dynasty', description: 'The peak of the Seuna dynasty ruling from Devagiri (Daulatabad).', image_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=800&auto=format&fit=crop' },
            { id: 'dummy3', year: '14th Century', title: 'Architecture and Culture', description: 'Significant contributions to Marathi literature and temple architecture.', image_url: 'https://images.unsplash.com/photo-1623869680517-578c7923485b?q=80&w=800&auto=format&fit=crop' },
          ]);
        }
        setLoading(false);
      });
  }, []);

  useGSAP(() => {
    if (loading) return;
    
    // Draw the main line
    gsap.to('.timeline-progress', {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '.timeline-container',
        start: 'top center',
        end: 'bottom center',
        scrub: true,
      }
    });

    const items = gsap.utils.toArray('.timeline-item');
    items.forEach((item: any, i) => {
      const dot = item.querySelector('.timeline-dot');
      const card = item.querySelector('.timeline-card');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: item,
          start: 'top 70%',
          toggleActions: 'play none none reverse'
        }
      });

      tl.fromTo(dot,
        { scale: 0, borderColor: '#dedad7', backgroundColor: '#ffffff' },
        { scale: 1.2, borderColor: '#000000', backgroundColor: '#000000', duration: 0.5, ease: 'back.out(2)' }
      )
      .fromTo(card,
        { opacity: 0, x: i % 2 === 0 ? 80 : -80, rotationY: i % 2 === 0 ? 25 : -25, transformPerspective: 1000 },
        { opacity: 1, x: 0, rotationY: 0, duration: 1, ease: 'power3.out' },
        "-=0.3"
      );
    });
  }, { scope: container, dependencies: [events, loading] });

  return (
    <section className="py-20 bg-white/40" ref={container}>
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-20 text-black">Historical Timeline</h2>

        {loading ? (
          <div className="text-center py-20 text-lg font-bold text-gray-500">Loading timeline...</div>
        ) : (
          <div className="timeline-container relative border-l-4 border-gray-200 ml-4 md:mx-auto md:w-full md:border-l-0 md:flex md:flex-col md:items-center">
            {/* Central Line for Desktop */}
            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-1 bg-gray-200 -translate-x-1/2"></div>
            {/* Animated Progress Line */}
            <div className="timeline-progress hidden md:block absolute top-0 bottom-0 left-1/2 w-1 bg-black -translate-x-1/2 origin-top" style={{ transform: 'scaleY(0)' }}></div>

            {events.map((data, idx) => (
              <div key={data.id} className={`timeline-item relative flex flex-col md:flex-row items-center justify-between w-full mb-20 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className="timeline-dot absolute left-[-11px] md:left-1/2 md:-translate-x-1/2 w-5 h-5 bg-[#dedad7] border-4 border-black rounded-full z-10 top-0 md:top-1/2 md:-translate-y-1/2"></div>

                <div className="w-full pl-8 md:pl-0 md:w-5/12 mb-6 md:mb-0">
                  <div className="timeline-card bg-white p-6 rounded-none border-2 border-black">
                    <h3 className="text-sm font-black text-black uppercase tracking-widest mb-1">{data.year}</h3>
                    <h4 className="text-xl font-black mb-2 text-black leading-tight tracking-tight">{data.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{data.description}</p>
                    {data.image_url && (
                      <div className="mt-4 overflow-hidden h-32 relative group cursor-pointer border border-gray-200">
                        <img src={data.image_url} alt={data.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transform transition duration-700 group-hover:scale-105" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
