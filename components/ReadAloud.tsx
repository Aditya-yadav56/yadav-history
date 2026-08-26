'use client';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square } from 'lucide-react';

interface ReadAloudProps {
  content: string;
  language: string; // 'English', 'Hindi', 'Telugu'
}

export default function ReadAloud({ content, language }: ReadAloudProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [debugMsg, setDebugMsg] = useState('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chunksRef = useRef<string[]>([]);
  const currentChunkIndex = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);

      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
        }
      };

      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
    
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanTextForSpeech = (text: string) => {
    return text
      // Remove Markdown headers (e.g., # or ###)
      .replace(/#+\s*/g, '')
      // Remove Bold/Italic asterisks
      .replace(/\*/g, '')
      // Replace multiple newlines with a single space to prevent weird pauses
      .replace(/\n+/g, ' ')
      .trim();
  };

  const selectVoice = () => {
    let targetLang = 'en-US';
    if (language === 'Hindi') targetLang = 'hi-IN';
    if (language === 'Telugu') targetLang = 'te-IN';

    // 1. Try to find an exact language match
    let validVoices = voices.filter(v => v.lang.startsWith(targetLang.split('-')[0]));
    
    // If no voice for specific language, fallback to english (might sound weird for Hindi/Telugu but better than nothing)
    if (validVoices.length === 0) {
      validVoices = voices.filter(v => v.lang.startsWith('en'));
    }

    // 2. Sort valid voices to aggressively prioritize high-quality Neural voices
    const getScore = (v: SpeechSynthesisVoice) => {
      let score = 0;
      const name = v.name.toLowerCase();
      if (name.includes('natural')) score += 10; // Microsoft Edge Neural voices
      if (name.includes('online')) score += 5;
      if (name.includes('google')) score += 5;   // Google Chrome cloud voices
      if (name.includes('premium')) score += 4;  // Apple high-quality voices
      if (name.includes('enhanced')) score += 4;
      if (v.localService === false) score += 2;  // Cloud-based voices are generally better than local
      return score;
    };

    validVoices.sort((a, b) => getScore(b) - getScore(a));
    return validVoices[0] || voices[0];
  };

  const speakNextChunk = () => {
    if (currentChunkIndex.current >= chunksRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setDebugMsg('');
      return;
    }

    const text = chunksRef.current[currentChunkIndex.current];
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Explicitly set volume
    utterance.volume = 1;
    utterance.rate = 0.95; 
    utterance.pitch = 1.0;

    const voice = selectVoice();
    if (voice) {
      utterance.voice = voice;
      // Some browsers need explicit lang if voice is set
      utterance.lang = voice.lang;
    } else {
      // Fallback lang if no voices loaded yet
      utterance.lang = language === 'Hindi' ? 'hi-IN' : language === 'Telugu' ? 'te-IN' : 'en-US';
    }

    utterance.onend = () => {
      currentChunkIndex.current += 1;
      speakNextChunk();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.error('Speech synthesis error on chunk:', e);
        setDebugMsg(`Error: ${e.error}`);
      }
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    
    try {
      window.speechSynthesis.speak(utterance);
    } catch (err: any) {
      setDebugMsg(`Speak throw: ${err.message}`);
    }
  };

  const handlePlay = () => {
    if (!isSupported) return;
    setDebugMsg('');

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const cleanedText = cleanTextForSpeech(content);
    const textWithIntro = `Welcome to Yadav History India. ${cleanedText}`;
    
    // Split text into chunks (sentences or small paragraphs) to prevent browser synthesis timeout/errors
    // Matches sequences ending in ., !, or ? or falls back to splitting by newlines if no punctuation
    let chunks = textWithIntro.match(/[^.!?]+[.!?]+/g);
    if (!chunks) {
      chunks = textWithIntro.split('\n');
    }
    
    chunksRef.current = chunks.map(c => c.trim()).filter(Boolean);
    currentChunkIndex.current = 0;
    
    if (chunksRef.current.length === 0) return;

    setIsPlaying(true);
    setIsPaused(false);
    speakNextChunk();
  };

  const handlePause = () => {
    if (!isSupported) return;
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (!isSupported) return;
    chunksRef.current = []; // Clear queue to stop onend from playing next chunk
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-3 bg-white border-2 border-black p-2 inline-flex mb-8 mt-4">
      <span className="text-xs font-black uppercase tracking-widest px-3">Listen to Article</span>
      
      <div className="flex border-l-2 border-black">
        {!isPlaying ? (
          <button 
            onClick={handlePlay}
            className="w-10 h-10 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
            title={isPaused ? 'Resume' : 'Play'}
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button 
            onClick={handlePause}
            className="w-10 h-10 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
            title="Pause"
          >
            <Pause className="w-4 h-4 fill-current" />
          </button>
        )}
        
        <button 
          onClick={handleStop}
          disabled={!isPlaying && !isPaused}
          className="w-10 h-10 flex items-center justify-center hover:bg-black hover:text-white transition-colors border-l-2 border-black disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black cursor-pointer disabled:cursor-not-allowed"
          title="Stop"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
      </div>
      {debugMsg && <span className="text-[10px] font-bold text-red-500 ml-3">{debugMsg}</span>}
    </div>
  );
}
