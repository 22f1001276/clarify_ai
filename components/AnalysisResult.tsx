import React, { useState, useEffect } from 'react';
import { AnalysisResult, RiskLevel } from '../types';
import { AlertTriangle, CheckCircle, Play, FileText, Pause, PenTool, DollarSign, Phone, Calendar, Mail, ClipboardList } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface AnalysisResultProps {
  result: AnalysisResult;
}

export const AnalysisResultDisplay: React.FC<AnalysisResultProps> = ({ result }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [audioElement]);

  const handlePlayAudio = async () => {
    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl) {
      // If we have an element already, just play it. 
      // Note: If the component re-rendered and lost the element ref but kept the URL (unlikely here due to state structure),
      // we recreate it. But here we rely on audioElement state.
      
      let audio = audioElement;
      if (!audio) {
         audio = new Audio(audioUrl);
         setAudioElement(audio);
      }
      
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      return;
    }

    try {
      setIsLoadingAudio(true);
      const url = await generateSpeech(result.simple_explanation);
      setAudioUrl(url);
      const audio = new Audio(url);
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    } catch (e) {
      setAudioError(true);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Helper to determine the best icon for an action item
  const getActionIcon = (actionText: string) => {
    const text = actionText.toLowerCase();
    if (text.includes('pay') || text.includes('bill') || text.includes('owe') || text.includes('cost') || text.includes('$')) {
      return <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />;
    }
    if (text.includes('sign') || text.includes('signature')) {
      return <PenTool className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
    }
    if (text.includes('call') || text.includes('phone') || text.includes('contact') || text.includes('number')) {
      return <Phone className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />;
    }
    if (text.includes('mail') || text.includes('send') || text.includes('address') || text.includes('post')) {
      return <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />;
    }
    if (text.includes('date') || text.includes('deadline') || text.includes('time') || text.includes('schedule') || text.includes('by')) {
      return <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />;
    }
    return <ClipboardList className="w-6 h-6 text-slate-500 dark:text-slate-400" />;
  };

  const isHighRisk = result.risk_level === RiskLevel.HIGH;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Risk Alert */}
      {isHighRisk && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-8 border-red-500 p-6 rounded-r-xl shadow-sm">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-2">Be Careful!</h3>
              <p className="text-lg text-red-800 dark:text-red-200">
                This document looks suspicious. It might be a scam. Do not pay any money or share personal details without talking to a trusted family member first.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 transition-colors duration-300">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          The Bottom Line
        </h2>
        <p className="text-xl md:text-2xl leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
          {result.summary}
        </p>
      </section>

      {/* Simple Explanation with Audio */}
      <section className="bg-indigo-50 dark:bg-indigo-900/20 p-6 md:p-8 rounded-3xl shadow-lg border border-indigo-100 dark:border-indigo-900/40 transition-colors duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            Simple Explanation
          </h2>
          <button
            onClick={handlePlayAudio}
            disabled={isLoadingAudio}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg shadow-md transition-all transform hover:scale-105 active:scale-95 ${
              isLoadingAudio 
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-wait' 
                : isPlaying
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                  : 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600'
            }`}
          >
            {isLoadingAudio ? (
              <span>Loading Voice...</span>
            ) : isPlaying ? (
              <>
                <Pause className="w-6 h-6 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-current" /> Read to Me
              </>
            )}
          </button>
        </div>
        <div className="prose prose-lg prose-indigo dark:prose-invert max-w-none">
          <p className="text-lg md:text-xl leading-8 text-slate-700 dark:text-slate-200 whitespace-pre-line">
            {result.simple_explanation}
          </p>
        </div>
        {audioError && (
          <p className="text-red-500 dark:text-red-400 mt-2">Could not load audio. Please read the text above.</p>
        )}
      </section>

      {/* Action Checklist */}
      {result.action_required.length > 0 && (
        <section className="bg-green-50 dark:bg-green-900/20 p-6 md:p-8 rounded-3xl shadow-lg border border-green-100 dark:border-green-900/40 transition-colors duration-300">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            What You Need To Do
          </h2>
          <ul className="space-y-4">
            {result.action_required.map((action, idx) => (
              <li key={idx} className="flex items-start gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-green-100 dark:border-slate-700">
                <div className="mt-1 flex-shrink-0">
                  {getActionIcon(action)}
                </div>
                <span className="text-xl text-slate-800 dark:text-slate-200 font-medium">{action}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};