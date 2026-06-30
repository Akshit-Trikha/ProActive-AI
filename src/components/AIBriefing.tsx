import { useState, useRef, useEffect } from 'react';
import { 
  Play, Square, Volume2, Sparkles, Clock, Compass, ShieldAlert, CheckCircle, Flame 
} from 'lucide-react';
import { ScheduleItem } from '../types';

interface AIBriefingProps {
  schedule: ScheduleItem[];
  recommendations: string[];
  motivationalSpeech: string;
}

export default function AIBriefing({ schedule, recommendations, motivationalSpeech }: AIBriefingProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
        sourceNodeRef.current.disconnect();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(console.error);
      }
    };
  }, []);

  // Clear/reset audio when the motivational speech changes, ensuring we generate a fresh briefing
  useEffect(() => {
    stopAudio();
    audioBufferRef.current = null;
    pausedAtRef.current = 0;
  }, [motivationalSpeech]);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {}
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const decodePCMToBuffer = (base64Audio: string, sampleRate: number = 24000): AudioBuffer => {
    const binaryString = window.atob(base64Audio);
    const len = binaryString.length;
    const numSamples = Math.floor(len / 2);
    
    const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioCtxRef.current) {
      audioCtxRef.current = ctx;
    }
    
    const audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < numSamples; i++) {
      const byte0 = binaryString.charCodeAt(i * 2);
      const byte1 = binaryString.charCodeAt(i * 2 + 1);
      
      // Gemini's raw 16-bit PCM is little-endian: byte1 is MSB, byte0 is LSB.
      let val = (byte1 << 8) | byte0;
      if (val & 0x8000) {
        val |= ~0xffff; // Sign extension
      }
      channelData[i] = val / 32768.0;
    }
    
    return audioBuffer;
  };

  const playAudio = async () => {
    if (!audioBufferRef.current) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    stopAudio();

    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(ctx.destination);

    const offset = pausedAtRef.current;
    source.start(0, offset);
    startTimeRef.current = ctx.currentTime - offset;
    sourceNodeRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
      if (sourceNodeRef.current === source) {
        setIsPlaying(false);
        pausedAtRef.current = 0;
        sourceNodeRef.current = null;
      }
    };
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current && audioCtxRef.current) {
      pausedAtRef.current = audioCtxRef.current.currentTime - startTimeRef.current;
      if (pausedAtRef.current >= (audioBufferRef.current?.duration || 0)) {
        pausedAtRef.current = 0;
      }
      stopAudio();
    }
  };

  const handlePlayBriefing = async () => {
    if (isPlaying) {
      pauseAudio();
      return;
    }

    if (audioBufferRef.current) {
      await playAudio();
      return;
    }

    setIsLoadingAudio(true);
    try {
      const textToSpeak = `${motivationalSpeech}. First, we will tackle ${schedule[0]?.taskTitle || 'your main tasks'}. Stay focused. Let's do this!`;
      
      const response = await fetch('/api/generate-briefing-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate voice. Ensure server is running.');
      }

      const data = await response.json();
      if (data.audio) {
        const mimeType = data.mimeType || "audio/l16;rate=24000";
        const rateMatch = mimeType.match(/rate=(\d+)/i);
        const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

        const buffer = decodePCMToBuffer(data.audio, sampleRate);
        audioBufferRef.current = buffer;
        await playAudio();
      }
    } catch (error: any) {
      console.error("Error generating briefing speech:", error);
      alert("Could not load the vocal briefing. Try again.");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleStopBriefing = () => {
    stopAudio();
    pausedAtRef.current = 0;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="ai-briefing-grid">
      {/* Motivational Speech & Voice Briefing */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
          {/* Accent blur decor */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full"></div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                AI Energy Briefing
              </span>
              <Volume2 className="w-4 h-4 text-indigo-600" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              "You've got this. Let's make every single minute count."
            </h3>

            <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed italic">
              {motivationalSpeech || "Complete your audit to receive a tailored, high-energy briefing block detailing exact schedules."}
            </p>

            {isPlaying && (
              <div className="flex items-center justify-center gap-1.5 py-4 px-6 bg-indigo-50/50 dark:bg-zinc-900/60 rounded-2xl border border-indigo-100/30 dark:border-zinc-800/50 mt-4">
                <div className="w-1.5 h-6 bg-indigo-500 rounded-full animate-eq-bar-1" />
                <div className="w-1.5 h-8 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-eq-bar-2" />
                <div className="w-1.5 h-5 bg-indigo-500 rounded-full animate-eq-bar-3" />
                <div className="w-1.5 h-9 bg-indigo-700 dark:bg-indigo-300 rounded-full animate-eq-bar-4" />
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full animate-eq-bar-5" />
                <div className="w-1.5 h-7 bg-indigo-500 rounded-full animate-eq-bar-6" />
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest pl-2">AI Speaking</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 relative z-10 flex flex-col gap-3">
            <button
              onClick={handlePlayBriefing}
              disabled={isLoadingAudio || !motivationalSpeech}
              id="btn-play-voice-briefing"
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isPlaying 
                  ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              } disabled:opacity-45 disabled:cursor-not-allowed`}
            >
              {isLoadingAudio ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Synthesizing Voice...
                </>
              ) : isPlaying ? (
                <>
                  <Square className="w-4 h-4 fill-red-600 text-red-600" />
                  Pause Audio Briefing
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white text-white" />
                  Play AI Vocal Briefing
                </>
              )}
            </button>
            
            {isPlaying && (
              <button
                onClick={handleStopBriefing}
                id="btn-stop-voice-briefing"
                className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                Stop & Reset
              </button>
            )}
            
            <p className="text-[10px] text-center text-slate-450 font-semibold uppercase tracking-wider">
              Google Gemini 3.1 Synthesis Engine
            </p>
          </div>
        </div>
      </div>

      {/* Focus Timeline Schedule */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs" id="timeline-card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4.5 h-4.5 text-teal-600" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Emergency Action Schedule (Hour-by-Hour)
            </h3>
          </div>

          {schedule.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">No active timeline blocks generated yet.</p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Add tasks and click the AI Priority Audit to block out your time!</p>
            </div>
          ) : (
            <div className="relative border-l border-slate-200 pl-4 ml-2.5 space-y-5 my-1">
              {schedule.map((item, index) => (
                <div key={index} className="relative group">
                  {/* Circle indicator on line */}
                  <span className="absolute -left-[22px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-teal-500 group-hover:scale-110 transition-transform">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
                  </span>
                  
                  <div>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded border border-teal-100 dark:border-teal-900/30">
                      {item.timeSlot}
                    </span>
                    <h4 className="text-slate-900 dark:text-white font-bold text-sm mt-2">
                      {item.taskTitle}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1.5 pl-2.5 border-l-2 border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40 p-2.5 rounded-xl">
                      {item.focusInstruction}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tactical Recommendations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs" id="recommendations-card">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4.5 h-4.5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Anti-Procrastination Guardrails
            </h3>
          </div>

          {recommendations.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-medium">
              AI recommendations will appear here after you conduct an audit.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.map((rec, index) => (
                <div 
                  key={index} 
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3 hover:border-indigo-200 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-700 leading-snug">
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
