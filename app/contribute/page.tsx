'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UploadCloud, X, CheckCircle } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import CustomSelect from '@/components/CustomSelect';

export default function ContributePage() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('English');
  const [category, setCategory] = useState('Yadav Kings');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useGSAP(() => {
    gsap.fromTo(containerRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    );
  }, { dependencies: [session, isLogin, message] });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage('Check your email for the confirmation link.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setUploading(true);
    setMessage('');

    let publicImageUrl = '';

    // Upload image to Supabase Storage if a file was selected
    if (imageFile) {
      setMessage('Uploading image...');
      const ext = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, imageFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        setMessage(`Image upload failed: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(uploadData.path);
      publicImageUrl = urlData.publicUrl;
    }

    setMessage('Submitting article...');
    const { error } = await supabase
      .from('articles')
      .insert([{
        title,
        content,
        language,
        category,
        image_url: publicImageUrl,
        status: 'pending',
        user_id: session.user.id,
      }]);

    setUploading(false);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('success');
      setTitle('');
      setContent('');
      clearImage();
    }
  };

  if (!session) {
    return (
      <div ref={containerRef} className="max-w-md mx-auto mt-20 p-10 bg-white border-2 border-black rounded-none">
        <h2 className="text-4xl font-black text-center mb-10 text-black uppercase tracking-tighter">
          {isLogin ? 'Welcome Back' : 'Join Us'}
        </h2>
        <form onSubmit={handleAuth} className="space-y-8">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-0 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-0 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors" />
          </div>
          {message && <p className="text-black bg-gray-100 border-l-4 border-black p-3 text-sm font-bold">{message}</p>}
          <button type="submit" className="w-full bg-black border-2 border-black text-white font-black uppercase tracking-widest py-4 hover:bg-white hover:text-black transition-colors">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm font-bold text-gray-500 uppercase tracking-wider">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-black border-b-2 border-black hover:border-transparent transition-colors ml-2">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    );
  }

  if (message === 'success') {
    return (
      <div ref={containerRef} className="max-w-md mx-auto mt-20 p-12 bg-white border-2 border-black rounded-none text-center">
        <CheckCircle className="w-16 h-16 text-black mx-auto mb-6" strokeWidth={1.5} />
        <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Article Submitted</h2>
        <p className="text-gray-600 mb-8 font-medium">Your article has been sent for approval. It will go live once reviewed.</p>
        <button onClick={() => setMessage('')} className="bg-black text-white font-black uppercase tracking-widest py-3 px-8 border-2 border-black hover:bg-white hover:text-black transition-colors">
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto px-4 py-12 w-full">
      <div className="flex justify-between items-end mb-12 border-b-2 border-black pb-4">
        <h1 className="text-5xl font-black text-black uppercase tracking-tighter">Contribute</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-sm font-black text-gray-500 uppercase tracking-widest hover:text-black transition-colors">Sign Out</button>
      </div>

      <div className="bg-white p-10 border-2 border-black rounded-none">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Article Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full px-0 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors text-xl font-bold" />
          </div>

          <div className="flex gap-8 flex-col sm:flex-row">
            <div className="flex-1">
              <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Language</label>
              <CustomSelect
                value={language}
                onChange={setLanguage}
                options={[
                  { value: 'English', label: 'English' },
                  { value: 'Hindi', label: 'Hindi' },
                  { value: 'Telugu', label: 'Telugu' },
                ]}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Category</label>
              <CustomSelect
                value={category}
                onChange={setCategory}
                options={[
                  { value: 'Yadav Kings', label: 'Yadav Kings' },
                  { value: 'Historical Places', label: 'Historical Places' },
                  { value: 'Culture & Art', label: 'Culture & Art' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Article Image (optional)</label>
            {imagePreview ? (
              <div className="relative border-2 border-black p-2">
                <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover grayscale" />
                <button type="button" onClick={clearImage}
                  className="absolute top-4 right-4 bg-black text-white p-2 hover:bg-gray-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-black rounded-none p-12 text-center cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100">
                <UploadCloud className="w-12 h-12 text-black mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-black font-black uppercase tracking-widest text-sm mb-1">Upload Image</p>
                <p className="text-gray-500 text-xs uppercase tracking-wider">JPG, PNG, WEBP up to 5MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Content</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} required rows={10}
              className="w-full px-4 py-4 border-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors resize-y font-medium"></textarea>
          </div>

          {message && message !== 'success' && (
            <div className={`p-4 border-2 font-bold ${message.includes('Error') || message.includes('failed') ? 'border-black bg-black text-white' : 'border-black bg-gray-100 text-black'}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={uploading}
            className="w-full bg-black text-white font-black uppercase tracking-widest py-4 border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {uploading ? 'Processing...' : 'Submit for Approval'}
          </button>
        </form>
      </div>
    </div>
  );
}
