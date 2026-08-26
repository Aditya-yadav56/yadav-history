'use client';
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ReadAloud from '@/components/ReadAloud';

type Article = {
  id: string;
  title: string;
  content: string;
  language: string;
  category: string;
  image_url: string;
  created_at: string;
};

function parseInline(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-black">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
}

function parseContent(content: string) {
  return content.split('\n').map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      const text = trimmed.replace(/^###\s+/, '');
      return (
        <h3 key={idx} className="text-2xl md:text-3xl font-black mb-6 mt-12 uppercase tracking-tight text-black">
          <span dangerouslySetInnerHTML={{ __html: parseInline(text) }} />
        </h3>
      );
    }
    if (trimmed.startsWith('# ')) {
      const text = trimmed.replace(/^#\s+/, '');
      return (
        <h2 key={idx} className="text-4xl md:text-5xl font-black text-center mb-12 mt-16 uppercase tracking-tighter text-black">
          <span dangerouslySetInnerHTML={{ __html: parseInline(text) }} />
        </h2>
      );
    }
    if (trimmed === '') {
      return <div key={idx} className="h-4" />;
    }
    return (
      <p key={idx} className="mb-6 text-xl text-gray-800 leading-relaxed">
        <span dangerouslySetInnerHTML={{ __html: parseInline(trimmed) }} />
      </p>
    );
  });
}

export default function SingleArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      setLoading(true);
      // If it's a dummy ID, generate a mock article
      if (id.startsWith('dummy')) {
        setArticle({
          id: id,
          title: 'The Great Kings of Yadava',
          content: 'The Seuna dynasty, also known as the Yadavas of Devagiri, was an Indian dynasty, which at its peak ruled a kingdom stretching from the Narmada river in the north to the Tungabhadra river in the south, in the western part of the Deccan region.\n\nIts territory included present-day Maharashtra, north Karnataka and parts of Madhya Pradesh, from its capital at Devagiri (present-day Daulatabad in modern Maharashtra).\n\nThe Yadavas initially ruled as feudatories of the Western Chalukyas. Around the middle of the 12th century, as the Chalukya power waned, the Yadava king Bhillama V declared independence. The Yadava kingdom reached its peak under Simhana II, and flourished until the early 14th century, when it was annexed by the Delhi Sultanate.',
          language: 'English',
          category: 'Yadav Kings',
          image_url: 'https://images.unsplash.com/photo-1599557626941-0f73f2fb7c34?w=1200',
          created_at: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (data) setArticle(data);
      setLoading(false);
    }
    fetchArticle();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-xl animate-pulse">Loading...</div>;
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Article Not Found</h1>
        <Link href="/articles" className="border-b-2 border-black font-bold hover:border-transparent transition-colors">Return to Articles</Link>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-[#dedad7] pb-24">
      {/* Hero Header */}
      <div className="bg-white border-b-2 border-black pt-12 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/articles" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:text-gray-600 transition-colors mb-8 border border-black px-3 py-1 bg-black text-white hover:bg-white hover:text-black">
            <ArrowLeft className="w-4 h-4" /> Back to Archive
          </Link>
          <div className="flex gap-3 mb-6">
            <span className="border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-widest">{article.category}</span>
            <span className="bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-widest">{article.language}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-black leading-none tracking-tighter mb-6">{article.title}</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
            Published on {new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <ReadAloud content={article.content} language={article.language} />
        </div>
      </div>

      {/* Featured Image */}
      {article.image_url && (
        <div className="max-w-5xl mx-auto -mt-8 px-4 relative z-10">
          <div className="border-2 border-black bg-gray-200 w-full overflow-hidden">
            <img src={article.image_url} alt={article.title} className="w-full h-auto block" />
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className={`max-w-3xl mx-auto px-4 ${article.image_url ? 'pt-16' : 'pt-24'}`}>
        <div className="prose prose-lg prose-black max-w-none font-medium">
          {parseContent(article.content)}
        </div>
      </div>
    </article>
  );
}
