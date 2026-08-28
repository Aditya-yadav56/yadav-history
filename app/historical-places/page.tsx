'use client';
import { useState, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { X, ZoomIn, ZoomOut, Maximize2, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Place = {
  id: string;
  name: string;
  state: string;
  stateId: string;
  description: string;
  image_url: string;
  // Coordinates on the 1000×1000 viewBox of the india.svg
  x: number;
  y: number;
};


// States relevant to Yadava history — highlighted in the sidebar
const FEATURED_STATES: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All States' },
  { id: 'INMH', label: 'Maharashtra' },
  { id: 'INKA', label: 'Karnataka' },
  { id: 'INTG', label: 'Telangana' },
  { id: 'INMP', label: 'Madhya Pradesh' },
  { id: 'INUP', label: 'Uttar Pradesh' },
  { id: 'INRJ', label: 'Rajasthan' },
  { id: 'INGJ', label: 'Gujarat' },
  { id: 'INAP', label: 'Andhra Pradesh' },
  { id: 'INTN', label: 'Tamil Nadu' },
];

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col gap-1.5">
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
    </div>
  );
}

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
        <h3 key={idx} className="text-sm font-black mb-2 mt-4 uppercase tracking-tight text-black">
          <span dangerouslySetInnerHTML={{ __html: parseInline(text) }} />
        </h3>
      );
    }
    if (trimmed.startsWith('# ')) {
      const text = trimmed.replace(/^#\s+/, '');
      return (
        <h2 key={idx} className="text-md font-black mb-3 mt-6 uppercase tracking-tighter text-black">
          <span dangerouslySetInnerHTML={{ __html: parseInline(text) }} />
        </h2>
      );
    }
    if (trimmed === '') {
      return <div key={idx} className="h-2" />;
    }
    return (
      <p key={idx} className="mb-3 text-sm text-gray-700 leading-relaxed">
        <span dangerouslySetInnerHTML={{ __html: parseInline(trimmed) }} />
      </p>
    );
  });
}

export default function HistoricalPlacesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [selectedStateId, setSelectedStateId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [hoveredPlace, setHoveredPlace] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Fetch sites from Supabase
  useEffect(() => {
    async function loadSites() {
      setPlacesLoading(true);
      const { data } = await supabase.from('historical_sites').select('*').order('created_at', { ascending: true });
      if (data) {
        setPlaces(data.map((s: any) => ({
          id: s.id,
          name: s.name,
          state: s.state,
          stateId: s.state_id,
          description: s.description,
          image_url: s.image_url || '',
          x: s.x,
          y: s.y,
        })));
      }
      setPlacesLoading(false);
    }
    loadSites();
  }, []);

  const filteredPlaces = places.filter(p => {
    const matchesState = selectedStateId === 'ALL' || p.stateId === selectedStateId;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesSearch;
  });

  // Fetch the real SVG
  useEffect(() => {
    fetch('/india.svg')
      .then(res => res.text())
      .then(text => {
        // Strip the XML declaration and extract the inner SVG
        const cleaned = text.replace(/<\?xml[^>]*\?>/g, '').trim();
        setSvgContent(cleaned);
      });
  }, []);

  // Highlight selected state paths in the injected SVG
  useEffect(() => {
    if (!svgContainerRef.current || !svgContent) return;
    const svg = svgContainerRef.current.querySelector('svg');
    if (!svg) return;

    const paths = svg.querySelectorAll('path[id]');
    paths.forEach((path) => {
      const el = path as SVGPathElement;
      const id = el.getAttribute('id') || '';
      const isSelected = selectedStateId !== 'ALL' && el.id === selectedStateId;
      const isFeatured = FEATURED_STATES.some(s => s.id === el.id);

      if (isSelected) {
        el.setAttribute('fill', '#1a1a1a');
        el.setAttribute('stroke', '#000');
        el.setAttribute('stroke-width', '1.5');
      } else if (isFeatured) {
        el.setAttribute('fill', '#c8c2bc');
        el.setAttribute('stroke', '#000');
        el.setAttribute('stroke-width', '0.8');
      } else {
        el.setAttribute('fill', '#e8e4e0');
        el.setAttribute('stroke', '#bbb');
        el.setAttribute('stroke-width', '0.5');
      }

      // Make featured states clickable
      if (isFeatured) {
        el.style.cursor = 'pointer';
        el.onclick = () => {
          setSelectedStateId(prev => prev === id ? 'ALL' : id);
          setSelectedPlace(null);
        };
      }
    });
  }, [svgContent, selectedStateId]);

  const selectedStateLabel = FEATURED_STATES.find(s => s.id === selectedStateId)?.label || 'All States';

  return (
    <div className="min-h-screen bg-[#dedad7]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-8">
        <h1 className="text-6xl md:text-8xl font-black text-black uppercase tracking-tighter mb-3 leading-none">
          Historical<br />Places
        </h1>
        <p className="text-gray-600 font-medium text-lg max-w-xl mt-4">
          Explore the sacred forts, temples, and ruins of the Yadava empire across India.
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500">
          <MapPin className="w-3 h-3" />
          Scroll to zoom · Drag to pan · Click a state or pin to explore
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16 flex flex-col lg:flex-row gap-6">

        {/* Sidebar */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="sticky top-20 space-y-4">
            
            {/* Search Box */}
            <div className="bg-white border-2 border-black p-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-black mb-2">Search Places</label>
              <input 
                type="text" 
                placeholder="TYPE TO SEARCH..." 
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setSelectedPlace(null);
                }}
                className="w-full px-3 py-2 text-xs border-2 border-black bg-white text-black font-bold uppercase tracking-widest focus:outline-none placeholder-gray-400"
              />
            </div>

            {/* Filter by State */}
            <div className="bg-white border-2 border-black">
              <div className="border-b-2 border-black px-4 py-3 bg-black text-white">
                <h3 className="font-black uppercase tracking-widest text-xs">Filter by State</h3>
              </div>
              {FEATURED_STATES.map(({ id, label }) => (
                <button key={id} onClick={() => { setSelectedStateId(id); setSelectedPlace(null); }}
                  className={`w-full text-left px-4 py-3 text-sm font-bold border-b border-gray-100 transition-colors flex items-center justify-between
                    ${selectedStateId === id ? 'bg-black text-white' : 'hover:bg-gray-50 text-gray-800'}`}>
                  {label}
                  {selectedStateId === id && <ChevronRight className="w-3 h-3" />}
                </button>
              ))}
              <div className="px-4 py-3">
                <div className="text-xs font-black uppercase tracking-widest text-gray-400">
                  {placesLoading ? 'Loading...' : `${filteredPlaces.length} place${filteredPlaces.length !== 1 ? 's' : ''}`}
                </div>
              </div>

              {/* Legend */}
              <div className="border-t-2 border-black px-4 py-4 space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-black mb-2">Legend</p>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <div className="w-4 h-4 bg-[#c8c2bc] border border-black flex-shrink-0"></div>
                  Yadava Region
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <div className="w-4 h-4 bg-black flex-shrink-0"></div>
                  Selected State
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <div className="w-4 h-4 rounded-full bg-white border-2 border-black flex-shrink-0"></div>
                  Historical Site
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow min-w-0">
          {/* Map */}
          <div className="border-2 border-black bg-white relative overflow-hidden" style={{ height: 600 }}>
            <TransformWrapper
              initialScale={1}
              minScale={0.4}
              maxScale={10}
              centerOnInit
              limitToBounds={false}
            >
              <>
                <ZoomControls />
                <TransformComponent
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  contentStyle={{ position: 'relative' }}
                >
                  <div className="relative" style={{ width: 1000, height: 1000 }}>
                    {/* Injected real India SVG */}
                    <div
                      ref={svgContainerRef}
                      dangerouslySetInnerHTML={{ __html: svgContent }}
                      style={{ width: 1000, height: 1000, display: 'block' }}
                    />

                  {/* Pins overlay — absolute positioned on top of SVG */}
                    <svg
                      viewBox="0 0 1000 1000"
                      style={{ position: 'absolute', top: 0, left: 0, width: 1000, height: 1000, pointerEvents: 'none' }}
                    >
                      {placesLoading ? null : filteredPlaces.map((place) => {
                        const isHovered = hoveredPlace === place.id;
                        const isSelected = selectedPlace?.id === place.id;
                        const R = isHovered || isSelected ? 18 : 13;

                        return (
                          <g
                            key={place.id}
                            transform={`translate(${place.x}, ${place.y})`}
                            style={{ cursor: 'pointer', pointerEvents: 'all' }}
                            onMouseEnter={() => setHoveredPlace(place.id)}
                            onMouseLeave={() => setHoveredPlace(null)}
                            onClick={() => setSelectedPlace(prev => prev?.id === place.id ? null : place)}
                          >
                            <defs>
                              <clipPath id={`imgclip-${place.id}`}>
                                <circle cx="0" cy="0" r={R} />
                              </clipPath>
                            </defs>

                            {/* Outer ring */}
                            <circle cx="0" cy="0" r={R + 4}
                              fill="white"
                              stroke="black"
                              strokeWidth={isSelected ? 3 : 2}
                            />

                            {/* Photo */}
                            <image
                              href={place.image_url}
                              x={-R} y={-R}
                              width={R * 2} height={R * 2}
                              clipPath={`url(#imgclip-${place.id})`}
                              preserveAspectRatio="xMidYMid slice"
                              style={{
                                filter: isHovered || isSelected ? 'none' : 'grayscale(80%)',
                                transition: 'all 0.3s',
                              }}
                            />

                            {/* Selection dashed ring */}
                            {isSelected && (
                              <circle cx="0" cy="0" r={R + 11}
                                fill="none" stroke="black"
                                strokeWidth="1.5"
                                strokeDasharray="4 3"
                                opacity="0.6"
                              />
                            )}

                            {/* Hover tooltip */}
                            {isHovered && !isSelected && (
                              <g transform="translate(0, -40)">
                                <rect x="-55" y="-15" width="110" height="20"
                                  fill="black" rx="0" />
                                <text x="0" y="-2"
                                  textAnchor="middle" fontSize="8.5"
                                  fontWeight="900" fill="white"
                                  fontFamily="system-ui, sans-serif"
                                  style={{ letterSpacing: '0.04em' }}>
                                  {place.name}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </TransformComponent>
              </>
            </TransformWrapper>

            {/* Status bar */}
            <div className="absolute bottom-0 left-0 right-0 border-t-2 border-black bg-white px-4 py-2 flex items-center gap-4 text-xs font-black uppercase tracking-widest">
              <span className="text-black">{selectedStateLabel}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">{filteredPlaces.length} sites</span>
              {selectedPlace && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="text-black">{selectedPlace.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Selected Place Detail Card */}
          {selectedPlace && (
            <div className="mt-4 bg-white border-2 border-black flex flex-col md:flex-row overflow-hidden">
              <div className="md:w-64 flex-shrink-0 border-r-0 md:border-r-2 border-b-2 md:border-b-0 border-black overflow-hidden">
                <img
                  src={selectedPlace.image_url}
                  alt={selectedPlace.name}
                  className="w-full h-48 md:h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="p-8 flex-grow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest border border-black px-2 py-1 inline-block mb-4">
                      {selectedPlace.state}
                    </span>
                    <h2 className="text-3xl font-black text-black tracking-tight leading-tight">
                      {selectedPlace.name}
                    </h2>
                  </div>
                  <button onClick={() => setSelectedPlace(null)}
                    className="flex-shrink-0 w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4">
                  {parseContent(selectedPlace.description)}
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 border-t border-gray-100 pt-4">
                  <MapPin className="w-3 h-3" />
                  Click another pin on the map to explore more
                </div>
              </div>
            </div>
          )}

          {/* Place Grid */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-3">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-black">
                {selectedStateLabel === 'All States' ? 'All Sites' : selectedStateLabel}
              </h2>
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">
                {filteredPlaces.length} locations
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => setSelectedPlace(prev => prev?.id === place.id ? null : place)}
                  className={`text-left border-2 flex overflow-hidden group transition-colors
                    ${selectedPlace?.id === place.id
                      ? 'border-black bg-black text-white'
                      : 'border-black bg-white hover:bg-gray-50 text-black'}`}
                >
                  <div className="w-20 h-20 flex-shrink-0 overflow-hidden border-r-2 border-black">
                    <img
                      src={place.image_url} alt={place.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  </div>
                  <div className="p-3 flex flex-col justify-center">
                    <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedPlace?.id === place.id ? 'text-gray-300' : 'text-gray-500'}`}>
                      {place.state}
                    </div>
                    <div className="font-black text-sm leading-tight">
                      {place.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
