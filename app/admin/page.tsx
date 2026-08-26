'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UploadCloud, X, PlusCircle, Trash2, CheckCircle, XCircle, Edit3, MapPin, ZoomIn, ZoomOut, Maximize2, Crosshair } from 'lucide-react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';

type Article = {
  id: string;
  title: string;
  content: string;
  language: string;
  category: string;
  image_url: string;
  status: string;
};

type TimelineEvent = {
  id: string;
  year: string;
  title: string;
  description: string;
  image_url: string;
  sort_order: number;
};

type HistoricalSite = {
  id: string;
  name: string;
  state: string;
  state_id: string;
  description: string;
  image_url: string;
  x: number;
  y: number;
};

const STATE_OPTIONS = [
  { id: 'INMH', label: 'Maharashtra' },
  { id: 'INKA', label: 'Karnataka' },
  { id: 'INTG', label: 'Telangana' },
  { id: 'INMP', label: 'Madhya Pradesh' },
  { id: 'INUP', label: 'Uttar Pradesh' },
  { id: 'INRJ', label: 'Rajasthan' },
  { id: 'INGJ', label: 'Gujarat' },
  { id: 'INAP', label: 'Andhra Pradesh' },
  { id: 'INTN', label: 'Tamil Nadu' },
  { id: 'INKL', label: 'Kerala' },
  { id: 'INOR', label: 'Odisha' },
  { id: 'INWB', label: 'West Bengal' },
  { id: 'INBR', label: 'Bihar' },
  { id: 'INJH', label: 'Jharkhand' },
  { id: 'INCT', label: 'Chhattisgarh' },
  { id: 'INGAR', label: 'Goa' },
  { id: 'INHP', label: 'Himachal Pradesh' },
  { id: 'INPB', label: 'Punjab' },
  { id: 'INHR', label: 'Haryana' },
  { id: 'INDL', label: 'Delhi' },
  { id: 'INUT', label: 'Uttarakhand' },
  { id: 'INAS', label: 'Assam' },
  { id: 'INJK', label: 'Jammu and Kashmir' },
  { id: 'INLA', label: 'Ladakh' },
];

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'articles' | 'manage_articles' | 'add_article' | 'timeline' | 'historical_sites'>('articles');

  // Articles state (Pending)
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // Articles state (Approved)
  const [approvedArticles, setApprovedArticles] = useState<Article[]>([]);
  const [approvedArticlesLoading, setApprovedArticlesLoading] = useState(true);

  // Timeline state
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [newYear, setNewYear] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSortOrder, setNewSortOrder] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [timelineMsg, setTimelineMsg] = useState('');
  const [adding, setAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add/Edit Article state
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [newArticleTitle, setNewArticleTitle] = useState('');
  const [newArticleContent, setNewArticleContent] = useState('');
  const [newArticleLanguage, setNewArticleLanguage] = useState('English');
  const [newArticleCategory, setNewArticleCategory] = useState('Yadav Kings');
  const [newArticleImageFile, setNewArticleImageFile] = useState<File | null>(null);
  const [newArticleImagePreview, setNewArticleImagePreview] = useState<string | null>(null);
  const [articleMsg, setArticleMsg] = useState('');
  const [addingArticle, setAddingArticle] = useState(false);
  const articleFileInputRef = useRef<HTMLInputElement>(null);

  // Historical Sites state
  const [sites, setSites] = useState<HistoricalSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [svgContent, setSvgContent] = useState('');
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [siteName, setSiteName] = useState('');
  const [siteState, setSiteState] = useState('Maharashtra');
  const [siteStateId, setSiteStateId] = useState('INMH');
  const [siteDescription, setSiteDescription] = useState('');
  const [siteImageFile, setSiteImageFile] = useState<File | null>(null);
  const [siteImagePreview, setSiteImagePreview] = useState<string | null>(null);
  const [siteMsg, setSiteMsg] = useState('');
  const [addingSite, setAddingSite] = useState(false);
  const siteFileInputRef = useRef<HTMLInputElement>(null);
  const svgMapRef = useRef<HTMLDivElement>(null);
  const [placePinMode, setPlacePinMode] = useState(false);

  // Bulk Upload State
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadMsg, setBulkUploadMsg] = useState('');
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  useEffect(() => {
    if (session) {
      fetchPendingArticles();
      fetchApprovedArticles();
      fetchEvents();
      fetchSites();
    }
  }, [session]);

  // Load SVG for map editor
  useEffect(() => {
    if (activeTab === 'historical_sites' && !svgContent) {
      fetch('/india.svg')
        .then(res => res.text())
        .then(text => {
          let cleaned = text.replace(/<\?xml[^>]*\?>/g, '').trim();
          // Override the SVG's fixed width/height so it scales to fill container
          cleaned = cleaned
            .replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1 width="100%"')
            .replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1 height="100%"');
          // If no preserveAspectRatio, add it so the map fills but keeps correct proportions
          if (!cleaned.includes('preserveAspectRatio')) {
            cleaned = cleaned.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
          }
          setSvgContent(cleaned);
        });
    }
  }, [activeTab, svgContent]);

  async function fetchPendingArticles() {
    setArticlesLoading(true);
    const { data } = await supabase.from('articles').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    if (data) setArticles(data);
    setArticlesLoading(false);
  }

  async function fetchApprovedArticles() {
    setApprovedArticlesLoading(true);
    const { data } = await supabase.from('articles').select('*').eq('status', 'approved').order('created_at', { ascending: false });
    if (data) setApprovedArticles(data);
    setApprovedArticlesLoading(false);
  }

  async function fetchEvents() {
    setEventsLoading(true);
    const { data } = await supabase.from('timeline_events').select('*').order('sort_order', { ascending: true });
    if (data) setEvents(data);
    setEventsLoading(false);
  }

  async function fetchSites() {
    setSitesLoading(true);
    const { data } = await supabase.from('historical_sites').select('*').order('created_at', { ascending: true });
    if (data) setSites(data);
    setSitesLoading(false);
  }

  const approveArticle = async (id: string) => {
    await supabase.from('articles').update({ status: 'approved' }).eq('id', id);
    setArticles(articles.filter(a => a.id !== id));
    fetchApprovedArticles();
  };

  const deleteArticle = async (id: string) => {
    await supabase.from('articles').delete().eq('id', id);
    setArticles(articles.filter(a => a.id !== id));
    setApprovedArticles(approvedArticles.filter(a => a.id !== id));
  };

  const deleteEvent = async (id: string) => {
    await supabase.from('timeline_events').delete().eq('id', id);
    setEvents(events.filter(e => e.id !== id));
  };

  const deleteSite = async (id: string) => {
    await supabase.from('historical_sites').delete().eq('id', id);
    setSites(sites.filter(s => s.id !== id));
  };

  // Timeline Image handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };
  const clearImage = () => {
    setNewImageFile(null);
    setNewImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setTimelineMsg('');
    let publicImageUrl = '';
    if (newImageFile) {
      setTimelineMsg('Uploading image...');
      const ext = newImageFile.name.split('.').pop();
      const fileName = `timeline-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('images').upload(fileName, newImageFile, { cacheControl: '3600', upsert: false });
      if (uploadError) {
        setTimelineMsg(`Image upload failed: ${uploadError.message}`);
        setAdding(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(uploadData.path);
      publicImageUrl = urlData.publicUrl;
    }
    const { error } = await supabase.from('timeline_events').insert([{
      year: newYear, title: newTitle, description: newDescription,
      sort_order: parseInt(newSortOrder) || 0, image_url: publicImageUrl,
    }]);
    setAdding(false);
    if (error) {
      setTimelineMsg(`Error: ${error.message}`);
    } else {
      setTimelineMsg('Event added!');
      setNewYear(''); setNewTitle(''); setNewDescription(''); setNewSortOrder('');
      clearImage();
      fetchEvents();
      setNewArticleImagePreview(null);
      setEditingArticleId(null);
    }
    setAddingArticle(false);
  }

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Find the JSON file
    const jsonFile = files.find(f => f.name.endsWith('.json'));
    if (!jsonFile) {
      setBulkUploadMsg('Error: Please include a .json file in your selection.');
      return;
    }

    setBulkUploading(true);
    setBulkUploadMsg('Parsing JSON...');

    try {
      const text = await jsonFile.text();
      const articles = JSON.parse(text);

      if (!Array.isArray(articles)) {
        throw new Error('JSON file must contain an array of objects.');
      }

      setBulkUploadMsg('Uploading images...');
      const imageFiles = files.filter(f => f.type.startsWith('image/'));

      // Process articles and upload their images if they match a local file
      const formattedArticles = await Promise.all(articles.map(async (art) => {
        let finalImageUrl = art.image_url || '';

        // If the image_url matches an uploaded file's name
        const matchedImage = imageFiles.find(img => img.name === finalImageUrl);
        if (matchedImage) {
          try {
            const fileExt = matchedImage.name.split('.').pop();
            const fileName = `bulk_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('images')
              .upload(fileName, matchedImage);
              
            if (uploadError) {
              // Bucket may not exist yet — skip image, article will still be saved
              console.warn(`Image upload skipped for "${matchedImage.name}": ${uploadError.message}`);
              finalImageUrl = '';
            } else {
              const { data } = supabase.storage.from('images').getPublicUrl(fileName);
              finalImageUrl = data.publicUrl;
            }
          } catch (imgErr: any) {
            console.warn(`Image upload failed for "${matchedImage.name}": ${imgErr.message}`);
            finalImageUrl = '';
          }
        }

        return {
          title: art.title,
          content: art.content,
          language: art.language || 'English',
          category: art.category || 'Other',
          image_url: finalImageUrl,
          status: 'approved'
        };
      }));

      setBulkUploadMsg('Saving articles to database...');
      const { error } = await supabase.from('articles').insert(formattedArticles);
      
      if (error) throw error;

      setBulkUploadMsg(`Successfully uploaded ${formattedArticles.length} articles!`);
      fetchApprovedArticles(); // Refresh list
    } catch (err: any) {
      setBulkUploadMsg(`Error: ${err.message || 'Failed to process bulk upload'}`);
    } finally {
      setBulkUploading(false);
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
    }
  };

  const handleArticleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewArticleImageFile(file);
    setNewArticleImagePreview(URL.createObjectURL(file));
  };

  const clearArticleImage = () => {
    setNewArticleImageFile(null);
    setNewArticleImagePreview(null);
    if (articleFileInputRef.current) articleFileInputRef.current.value = '';
  };

  const handleEditArticleClick = (article: Article) => {
    setEditingArticleId(article.id);
    setNewArticleTitle(article.title);
    setNewArticleContent(article.content);
    setNewArticleLanguage(article.language);
    setNewArticleCategory(article.category);
    setNewArticleImagePreview(article.image_url || null);
    setNewArticleImageFile(null);
    setActiveTab('add_article');
  };

  const cancelEdit = () => {
    setEditingArticleId(null);
    setNewArticleTitle('');
    setNewArticleContent('');
    clearArticleImage();
  };

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setAddingArticle(true);
    setArticleMsg('');
    let publicImageUrl: string | null = newArticleImagePreview;
    if (newArticleImageFile) {
      setArticleMsg('Uploading image...');
      const ext = newArticleImageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images').upload(fileName, newArticleImageFile, { cacheControl: '3600', upsert: false });
      if (uploadError) {
        setArticleMsg(`Image upload failed: ${uploadError.message}`);
        setAddingArticle(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(uploadData.path);
      publicImageUrl = urlData.publicUrl;
    }
    setArticleMsg(editingArticleId ? 'Updating article...' : 'Publishing article...');
    if (editingArticleId) {
      const { error } = await supabase.from('articles').update({
        title: newArticleTitle, content: newArticleContent,
        language: newArticleLanguage, category: newArticleCategory, image_url: publicImageUrl,
      }).eq('id', editingArticleId);
      setAddingArticle(false);
      if (error) { setArticleMsg(`Error: ${error.message}`); }
      else {
        setArticleMsg('Article updated successfully!');
        cancelEdit(); fetchPendingArticles(); fetchApprovedArticles();
        setTimeout(() => setArticleMsg(''), 3000);
      }
    } else {
      const { error } = await supabase.from('articles').insert([{
        title: newArticleTitle, content: newArticleContent,
        language: newArticleLanguage, category: newArticleCategory,
        image_url: publicImageUrl, status: 'approved', user_id: session.user.id,
      }]);
      setAddingArticle(false);
      if (error) { setArticleMsg(`Error: ${error.message}`); }
      else {
        setArticleMsg('Article published successfully!');
        setNewArticleTitle(''); setNewArticleContent(''); clearArticleImage();
        fetchApprovedArticles();
        setTimeout(() => setArticleMsg(''), 3000);
      }
    }
  };

  // Historical Sites handlers
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // The overlay div is exactly 1000x1000 to match the SVG viewBox
    // So offsetX/offsetY are already in SVG coordinate space
    const x = Math.round(e.nativeEvent.offsetX);
    const y = Math.round(e.nativeEvent.offsetY);
    setPendingPin({ x, y });
    setSiteMsg('');
    setActiveTab('historical_sites'); // keep focused
  };

  const handleSiteImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSiteImageFile(file);
    setSiteImagePreview(URL.createObjectURL(file));
  };

  const clearSiteImage = () => {
    setSiteImageFile(null);
    setSiteImagePreview(null);
    if (siteFileInputRef.current) siteFileInputRef.current.value = '';
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPin) return;
    setAddingSite(true);
    setSiteMsg('');
    let publicImageUrl = '';
    if (siteImageFile) {
      setSiteMsg('Uploading image...');
      const ext = siteImageFile.name.split('.').pop();
      const fileName = `site-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images').upload(fileName, siteImageFile, { cacheControl: '3600', upsert: false });
      if (uploadError) {
        setSiteMsg(`Image upload failed: ${uploadError.message}`);
        setAddingSite(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(uploadData.path);
      publicImageUrl = urlData.publicUrl;
    }
    const { error } = await supabase.from('historical_sites').insert([{
      name: siteName, state: siteState, state_id: siteStateId,
      description: siteDescription, image_url: publicImageUrl,
      x: pendingPin.x, y: pendingPin.y,
    }]);
    setAddingSite(false);
    if (error) {
      setSiteMsg(`Error: ${error.message}`);
    } else {
      setSiteMsg('Site added successfully!');
      setPendingPin(null);
      setSiteName(''); setSiteDescription('');
      clearSiteImage();
      fetchSites();
      setTimeout(() => setSiteMsg(''), 3000);
    }
  };

  const ADMIN_EMAIL = 'amaraavathifocus@gmail.com';
  if (!session || session.user?.email !== ADMIN_EMAIL) {
    return (
      <div className="text-center py-20 font-black text-xl text-black uppercase tracking-widest">
        Access Denied. You do not have admin privileges.
        <div className="mt-8">
          <button onClick={() => supabase.auth.signOut()} className="text-sm border-b-2 border-black pb-1 hover:border-transparent transition-colors">Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 w-full">
      <div className="flex justify-between items-end mb-12 border-b-2 border-black pb-4">
        <h1 className="text-5xl font-black text-black uppercase tracking-tighter">Admin Dashboard</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-sm font-black text-gray-500 uppercase tracking-widest hover:text-black transition-colors">Sign Out</button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-10 border-b-2 border-black pb-4">
        {([
          { key: 'articles', label: `Approvals${articles.length > 0 ? ` (${articles.length})` : ''}` },
          { key: 'manage_articles', label: 'Manage Articles' },
          { key: 'add_article', label: editingArticleId ? 'Edit Article' : 'Post Article' },
          { key: 'timeline', label: 'Timeline' },
          { key: 'historical_sites', label: 'Historical Sites' },
        ] as { key: typeof activeTab; label: string }[]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 font-black uppercase tracking-widest transition-all border-2 border-black text-sm ${activeTab === tab.key ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Approvals Tab */}
      {activeTab === 'articles' && (
        <div>
          {articlesLoading ? (
            <div className="text-center font-black py-10 uppercase tracking-widest">Loading...</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16 bg-white border-2 border-black text-black font-black uppercase tracking-widest">No pending articles. All clear! ✅</div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {articles.map(article => (
                <div key={article.id} className="bg-white p-8 border-2 border-black flex flex-col md:flex-row gap-8">
                  {article.image_url ? (
                    <img src={article.image_url} alt={article.title} className="w-full md:w-64 h-48 object-cover border-2 border-black flex-shrink-0 grayscale" />
                  ) : (
                    <div className="w-full md:w-64 h-48 bg-gray-200 border-2 border-black flex items-center justify-center font-black uppercase tracking-widest text-gray-500">No Image</div>
                  )}
                  <div className="flex-1 flex flex-col">
                    <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
                      <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{article.title}</h3>
                      <div className="flex gap-2">
                        <span className="bg-black text-white text-xs px-2 py-1 font-black uppercase tracking-widest">{article.language}</span>
                        <span className="border-2 border-black text-black text-xs px-2 py-1 font-black uppercase tracking-widest">{article.category}</span>
                      </div>
                    </div>
                    <p className="text-black font-medium mb-6 line-clamp-3">{article.content}</p>
                    <div className="flex gap-4 mt-auto">
                      <button onClick={() => handleEditArticleClick(article)} className="flex-1 bg-white hover:bg-gray-100 text-black border-2 border-black font-black py-3 px-6 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                        <Edit3 className="w-5 h-5" /> Edit
                      </button>
                      <button onClick={() => approveArticle(article.id)} className="flex-1 bg-black hover:bg-white hover:text-black text-white border-2 border-black font-black py-3 px-6 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                        <CheckCircle className="w-5 h-5" /> Approve
                      </button>
                      <button onClick={() => deleteArticle(article.id)} className="flex-1 bg-white hover:bg-black hover:text-white text-black border-2 border-black font-black py-3 px-6 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                        <XCircle className="w-5 h-5" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manage Articles Tab */}
      {activeTab === 'manage_articles' && (
        <div>
          {approvedArticlesLoading ? (
            <div className="text-center font-black py-10 uppercase tracking-widest">Loading...</div>
          ) : approvedArticles.length === 0 ? (
            <div className="text-center py-16 bg-white border-2 border-black text-black font-black uppercase tracking-widest">No published articles found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {approvedArticles.map(article => (
                <div key={article.id} className="bg-white p-8 border-2 border-black flex flex-col md:flex-row gap-8">
                  {article.image_url ? (
                    <img src={article.image_url} alt={article.title} className="w-full md:w-64 h-48 object-cover border-2 border-black flex-shrink-0 grayscale" />
                  ) : (
                    <div className="w-full md:w-64 h-48 bg-gray-200 border-2 border-black flex items-center justify-center font-black uppercase tracking-widest text-gray-500">No Image</div>
                  )}
                  <div className="flex-1 flex flex-col">
                    <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
                      <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{article.title}</h3>
                      <div className="flex gap-2">
                        <span className="bg-black text-white text-xs px-2 py-1 font-black uppercase tracking-widest">{article.language}</span>
                        <span className="border-2 border-black text-black text-xs px-2 py-1 font-black uppercase tracking-widest">{article.category}</span>
                      </div>
                    </div>
                    <p className="text-black font-medium mb-6 line-clamp-3">{article.content}</p>
                    <div className="flex gap-4 mt-auto">
                      <button onClick={() => handleEditArticleClick(article)} className="flex-1 bg-black hover:bg-white hover:text-black text-white border-2 border-black font-black py-3 px-6 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                        <Edit3 className="w-5 h-5" /> Edit
                      </button>
                      <button onClick={() => deleteArticle(article.id)} className="flex-1 bg-white hover:bg-black hover:text-white text-black border-2 border-black font-black py-3 px-6 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
                        <Trash2 className="w-5 h-5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Article Tab */}
      {activeTab === 'add_article' && (
        <div className="space-y-12">
          
          {/* Bulk Upload Section (Only show if not editing) */}
          {!editingArticleId && (
            <div className="bg-white p-10 border-2 border-black border-dashed">
              <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-widest mb-4">
                <UploadCloud className="text-black" /> Bulk Upload JSON + Images
              </h2>
              <p className="text-sm font-bold text-gray-600 mb-6">
                Select your `.json` file AND any local images it references all at once.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <input 
                  type="file" 
                  accept=".json,image/*"
                  multiple
                  ref={bulkFileInputRef}
                  onChange={handleBulkUpload}
                  className="hidden" 
                />
                <button 
                  type="button"
                  onClick={() => bulkFileInputRef.current?.click()}
                  disabled={bulkUploading}
                  className="bg-black text-white px-8 py-3 font-black uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-colors disabled:opacity-50"
                >
                  {bulkUploading ? 'Uploading...' : 'Select Files'}
                </button>
                {bulkUploadMsg && (
                  <span className={`text-sm font-bold px-4 py-2 border-2 ${bulkUploadMsg.includes('Error') ? 'border-red-500 text-red-600 bg-red-50' : 'border-black text-black bg-gray-100'}`}>
                    {bulkUploadMsg}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="bg-white p-10 border-2 border-black">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black flex items-center gap-2 uppercase tracking-widest">
                {editingArticleId ? <><Edit3 className="text-black" /> Edit Article</> : <><PlusCircle className="text-black" /> Post New Article (Manual)</>}
              </h2>
              {editingArticleId && (
                <button onClick={cancelEdit} className="text-xs font-black uppercase tracking-widest border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
                  Cancel Edit
                </button>
              )}
            </div>
            <form onSubmit={handleAddArticle} className="space-y-10">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Article Title</label>
              <input type="text" value={newArticleTitle} onChange={e => setNewArticleTitle(e.target.value)} required
                className="w-full px-0 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors text-xl font-bold" />
            </div>
            <div className="flex gap-8 flex-col sm:flex-row">
              <div className="flex-1">
                <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Language</label>
                <select value={newArticleLanguage} onChange={e => setNewArticleLanguage(e.target.value)}
                  className="w-full px-0 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors cursor-pointer appearance-none rounded-none font-bold">
                  <option>English</option><option>Hindi</option><option>Telugu</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Category</label>
                <select value={newArticleCategory} onChange={e => setNewArticleCategory(e.target.value)}
                  className="w-full px-0 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors cursor-pointer appearance-none rounded-none font-bold">
                  <option>Yadav Kings</option><option>Historical Places</option><option>Culture & Art</option><option>Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Article Image (optional)</label>
              {newArticleImagePreview ? (
                <div className="relative border-2 border-black p-2">
                  <img src={newArticleImagePreview} alt="Preview" className="w-full h-64 object-cover grayscale" />
                  <button type="button" onClick={clearArticleImage} className="absolute top-4 right-4 bg-black text-white p-2 hover:bg-gray-800 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div onClick={() => articleFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-black p-12 text-center cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100">
                  <UploadCloud className="w-12 h-12 text-black mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-black font-black uppercase tracking-widest text-sm mb-1">Upload Image</p>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">JPG, PNG, WEBP up to 5MB</p>
                </div>
              )}
              <input ref={articleFileInputRef} type="file" accept="image/*" onChange={handleArticleImageChange} className="hidden" />
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-xs font-black uppercase tracking-widest text-black">Content</label>
                <div className="text-[10px] font-bold text-gray-500 flex gap-4">
                  <span># Heading</span><span>### Subheading</span><span>**Bold**</span><span>*Italic*</span>
                </div>
              </div>
              <textarea value={newArticleContent} onChange={e => setNewArticleContent(e.target.value)} required rows={10}
                className="w-full px-4 py-4 border-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors resize-y font-medium"></textarea>
            </div>
            {articleMsg && (
              <div className={`p-4 border-2 font-bold ${articleMsg.includes('Error') || articleMsg.includes('failed') ? 'border-black bg-black text-white' : 'border-black bg-gray-100 text-black'}`}>
                {articleMsg}
              </div>
            )}
            <button type="submit" disabled={addingArticle}
              className="w-full bg-black text-white font-black uppercase tracking-widest py-4 border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {addingArticle ? (editingArticleId ? 'Updating...' : 'Publishing...') : (editingArticleId ? 'Update Article' : 'Publish Article')}
            </button>
          </form>
        </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-12">
          <div className="bg-white p-10 border-2 border-black">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-2 uppercase tracking-widest"><PlusCircle className="text-black" /> Add Timeline Event</h2>
            <form onSubmit={handleAddEvent} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Year / Era</label>
                  <input type="text" placeholder="e.g. 12th Century" value={newYear} onChange={e => setNewYear(e.target.value)} required
                    className="w-full px-0 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors font-bold" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Title</label>
                  <input type="text" placeholder="Event title" value={newTitle} onChange={e => setNewTitle(e.target.value)} required
                    className="w-full px-0 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors font-bold text-xl" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Description</label>
                <textarea placeholder="Short description for the timeline card" value={newDescription} onChange={e => setNewDescription(e.target.value)} required rows={3}
                  className="w-full px-4 py-4 border-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors resize-none font-medium" />
              </div>
              <div className="flex gap-8 flex-col sm:flex-row">
                <div className="sm:w-32 flex-shrink-0">
                  <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Sort Order</label>
                  <input type="number" placeholder="1" value={newSortOrder} onChange={e => setNewSortOrder(e.target.value)}
                    className="w-full px-0 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors font-bold" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">Image</label>
                  {newImagePreview ? (
                    <div className="relative inline-block border-2 border-black p-1">
                      <img src={newImagePreview} alt="Preview" className="h-32 w-48 object-cover grayscale" />
                      <button type="button" onClick={clearImage} className="absolute top-2 right-2 bg-black text-white p-1 hover:bg-gray-800 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 p-8 text-center cursor-pointer hover:border-black transition-colors flex items-center justify-center gap-4 bg-gray-50 hover:bg-gray-100">
                      <UploadCloud className="w-8 h-8 text-black flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-black font-black uppercase tracking-widest text-sm">Upload image</span>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
              </div>
              {timelineMsg && (
                <div className={`p-4 border-2 font-bold ${timelineMsg.includes('Error') || timelineMsg.includes('failed') ? 'border-black bg-black text-white' : 'border-black bg-gray-100 text-black'}`}>{timelineMsg}</div>
              )}
              <button type="submit" disabled={adding}
                className="w-full bg-black hover:bg-white hover:text-black text-white border-2 border-black font-black uppercase tracking-widest py-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {adding ? 'Saving...' : 'Add Event'}
              </button>
            </form>
          </div>
          <div>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2 uppercase tracking-widest border-b-2 border-black pb-4">Existing Timeline Events</h2>
            {eventsLoading ? (
              <div className="text-center font-black py-10 uppercase tracking-widest">Loading...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-16 bg-white border-2 border-black text-black font-black uppercase tracking-widest">No events yet.</div>
            ) : (
              <div className="space-y-6">
                {events.map(event => (
                  <div key={event.id} className="bg-white p-6 border-2 border-black flex gap-6 items-center">
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.title} className="w-32 h-24 object-cover border-2 border-black flex-shrink-0 grayscale" />
                    ) : (
                      <div className="w-32 h-24 bg-gray-200 border-2 border-black flex-shrink-0 flex items-center justify-center text-gray-500 font-black uppercase tracking-widest text-[10px]">No img</div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest text-black mb-1">{event.year}</p>
                      <p className="font-black text-xl mb-2">{event.title}</p>
                      <p className="text-gray-700 text-sm line-clamp-2">{event.description}</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                      <span className="text-black font-black uppercase tracking-widest text-xs border border-black px-2 py-1">#{event.sort_order}</span>
                      <button onClick={() => deleteEvent(event.id)} className="text-black hover:text-white hover:bg-black border-2 border-black p-2 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historical Sites Tab */}
      {activeTab === 'historical_sites' && (
        <div className="space-y-8">

          {/* Instructions */}
          <div className="bg-white border-2 border-black px-6 py-4 flex items-start gap-3">
            <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-bold text-gray-700">
              <span className="font-black text-black uppercase tracking-widest">How to add a site:</span> Zoom/pan the map to find a location, enable <span className="font-black text-black">Place Pin Mode</span>, then click to drop a pin. Fill in the details on the right and save.
            </p>
          </div>

          {/* Map Editor + Form Panel */}
          <div className="flex flex-col xl:flex-row gap-6">
            {/* Map */}
            <div className="flex-1 min-w-0">
              <div className="border-2 border-black bg-white relative overflow-hidden" style={{ height: 620 }}>
                <TransformWrapper
                  initialScale={1}
                  minScale={0.4}
                  maxScale={20}
                  centerOnInit
                  limitToBounds={false}
                  panning={{ disabled: placePinMode }}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                      {/* Zoom controls */}
                      <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5">
                        {[
                          { icon: <ZoomIn className="w-4 h-4" />, fn: () => zoomIn() },
                          { icon: <ZoomOut className="w-4 h-4" />, fn: () => zoomOut() },
                          { icon: <Maximize2 className="w-4 h-4" />, fn: () => resetTransform() },
                        ].map((btn, i) => (
                          <button key={i} onClick={btn.fn}
                            className="w-9 h-9 bg-white border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                            {btn.icon}
                          </button>
                        ))}
                        {/* Place Pin Mode toggle */}
                        <button
                          onClick={() => { setPlacePinMode(p => !p); setPendingPin(null); }}
                          title={placePinMode ? 'Exit Pin Mode' : 'Place Pin Mode'}
                          className={`w-9 h-9 border-2 border-black flex items-center justify-center transition-colors mt-1 ${
                            placePinMode ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'
                          }`}>
                          <Crosshair className="w-4 h-4" />
                        </button>
                      </div>

                      <TransformComponent
                        wrapperStyle={{ width: '100%', height: '100%' }}
                        contentStyle={{ position: 'relative' }}
                      >
                        {/* Clickable overlay for placing pins — only active in pin mode */}
                        <div
                          ref={svgMapRef}
                          onClick={placePinMode ? handleMapClick : undefined}
                          style={{
                            position: 'absolute', top: 0, left: 0,
                            width: 1000, height: 1000,
                            cursor: placePinMode ? 'crosshair' : 'grab',
                            zIndex: 5,
                          }}
                        />

                        {/* SVG base map */}
                        {svgContent && (
                          <div
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                            style={{ width: 1000, height: 1000, display: 'block', pointerEvents: 'none' }}
                          />
                        )}

                        {/* Pins overlay */}
                        <svg
                          viewBox="0 0 1000 1000"
                          style={{ position: 'absolute', top: 0, left: 0, width: 1000, height: 1000, pointerEvents: 'none' }}
                        >
                          {sites.map(site => (
                            <g key={site.id} transform={`translate(${site.x}, ${site.y})`}>
                              <circle cx="0" cy="0" r="14" fill="white" stroke="black" strokeWidth="2" />
                              {site.image_url ? (
                                <>
                                  <defs>
                                    <clipPath id={`adminclip-${site.id}`}><circle cx="0" cy="0" r="11" /></clipPath>
                                  </defs>
                                  <image href={site.image_url} x="-11" y="-11" width="22" height="22"
                                    clipPath={`url(#adminclip-${site.id})`} preserveAspectRatio="xMidYMid slice" />
                                </>
                              ) : (
                                <circle cx="0" cy="0" r="6" fill="black" />
                              )}
                              <text x="0" y="-20" textAnchor="middle" fontSize="8" fontWeight="900" fill="black" fontFamily="system-ui">
                                {site.name.length > 16 ? site.name.slice(0, 14) + '…' : site.name}
                              </text>
                            </g>
                          ))}

                          {pendingPin && (
                            <g transform={`translate(${pendingPin.x}, ${pendingPin.y})`}>
                              <circle cx="0" cy="0" r="14" fill="black" stroke="white" strokeWidth="2" />
                              <text x="0" y="4" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="system-ui">+</text>
                              <circle cx="0" cy="0" r="22" fill="none" stroke="black" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
                            </g>
                          )}
                        </svg>
                      </TransformComponent>

                      {/* Status bar */}
                      <div className="absolute bottom-0 left-0 right-0 border-t-2 border-black bg-white px-4 py-2 z-30 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                        {placePinMode ? (
                          pendingPin
                            ? <><span className="text-black">Pin at ({pendingPin.x}, {pendingPin.y})</span><span className="text-gray-400">— Fill form →</span><button onClick={() => setPendingPin(null)} className="ml-auto text-gray-400 hover:text-black"><X className="w-3 h-3" /></button></>
                            : <><span className="w-2 h-2 bg-black inline-block animate-pulse" /><span className="text-black">Pin Mode ON — click anywhere on the map</span><button onClick={() => setPlacePinMode(false)} className="ml-auto text-gray-400 hover:text-black uppercase tracking-widest">Exit</button></>
                        ) : (
                          <span className="text-gray-500">Scroll to zoom · Drag to pan · Enable <Crosshair className="w-3 h-3 inline" /> to place a pin</span>
                        )}
                      </div>
                    </>
                  )}
                </TransformWrapper>
              </div>
            </div>

            {/* Form Panel */}
            <div className="xl:w-80 flex-shrink-0">
              {!pendingPin ? (
                <div className="h-full bg-white border-2 border-black border-dashed flex flex-col items-center justify-center p-10 text-center gap-4" style={{ minHeight: 300 }}>
                  <MapPin className="w-12 h-12 text-gray-300" strokeWidth={1} />
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">Click on the map to begin</p>
                </div>
              ) : (
                <div className="bg-white border-2 border-black p-6">
                  <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
                    <h3 className="font-black uppercase tracking-widest text-sm">New Site Details</h3>
                    <button onClick={() => setPendingPin(null)} className="w-8 h-8 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form onSubmit={handleAddSite} className="space-y-5">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-black mb-1">Site Name</label>
                      <input type="text" value={siteName} onChange={e => setSiteName(e.target.value)} required placeholder="e.g. Daulatabad Fort"
                        className="w-full px-0 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors font-bold text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-black mb-1">State</label>
                      <select
                        value={siteStateId}
                        onChange={e => {
                          setSiteStateId(e.target.value);
                          setSiteState(STATE_OPTIONS.find(s => s.id === e.target.value)?.label || '');
                        }}
                        className="w-full px-0 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors cursor-pointer appearance-none font-bold text-sm">
                        {STATE_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-xs font-black uppercase tracking-widest text-black">Description</label>
                        <div className="text-[9px] font-bold text-gray-500 flex gap-2">
                          <span># H1</span><span>**Bold**</span><span>*Italic*</span>
                        </div>
                      </div>
                      <textarea value={siteDescription} onChange={e => setSiteDescription(e.target.value)} required rows={4} placeholder="Describe this historical site..."
                        className="w-full px-3 py-2 border-2 border-gray-300 bg-transparent focus:outline-none focus:border-black transition-colors resize-none font-medium text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-black mb-1">Image</label>
                      {siteImagePreview ? (
                        <div className="relative border-2 border-black p-1">
                          <img src={siteImagePreview} alt="preview" className="w-full h-28 object-cover grayscale" />
                          <button type="button" onClick={clearSiteImage} className="absolute top-2 right-2 bg-black text-white p-1"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <div onClick={() => siteFileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer hover:border-black transition-colors bg-gray-50">
                          <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" strokeWidth={1.5} />
                          <p className="text-xs font-black uppercase tracking-widest text-gray-500">Upload Image</p>
                        </div>
                      )}
                      <input ref={siteFileInputRef} type="file" accept="image/*" onChange={handleSiteImageChange} className="hidden" />
                    </div>
                    {siteMsg && (
                      <div className={`p-3 border-2 font-bold text-sm ${siteMsg.includes('Error') || siteMsg.includes('failed') ? 'border-black bg-black text-white' : 'border-black bg-gray-100 text-black'}`}>
                        {siteMsg}
                      </div>
                    )}
                    <button type="submit" disabled={addingSite}
                      className="w-full bg-black text-white font-black uppercase tracking-widest py-3 border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50">
                      {addingSite ? 'Saving...' : 'Save Site'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Existing Sites List */}
          <div>
            <h2 className="text-2xl font-black mb-6 uppercase tracking-widest border-b-2 border-black pb-4">
              Saved Sites <span className="text-gray-400 font-black text-base">({sites.length})</span>
            </h2>
            {sitesLoading ? (
              <div className="text-center font-black py-10 uppercase tracking-widest">Loading...</div>
            ) : sites.length === 0 ? (
              <div className="text-center py-16 bg-white border-2 border-black text-black font-black uppercase tracking-widest">No sites yet. Click on the map above to add one!</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sites.map(site => (
                  <div key={site.id} className="bg-white border-2 border-black flex flex-col overflow-hidden">
                    {site.image_url ? (
                      <img src={site.image_url} alt={site.name} className="w-full h-36 object-cover grayscale" />
                    ) : (
                      <div className="w-full h-36 bg-gray-100 flex items-center justify-center border-b-2 border-black">
                        <MapPin className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <div className="p-4 flex-1 flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{site.state}</span>
                      <h4 className="font-black text-base mb-2 leading-tight">{site.name}</h4>
                      <p className="text-gray-600 text-xs line-clamp-2 flex-1">{site.description}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400">Pin: ({site.x}, {site.y})</span>
                        <button onClick={() => deleteSite(site.id)} className="text-black hover:text-white hover:bg-black border-2 border-black p-1.5 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
