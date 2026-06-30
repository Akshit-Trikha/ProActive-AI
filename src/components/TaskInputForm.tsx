import { useState, FormEvent } from 'react';
import { Plus, Sparkles, AlertCircle, FileText, Calendar, Tag, CornerDownRight } from 'lucide-react';
import { Task, TaskCategory } from '../types';

interface TaskInputFormProps {
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onAddMultipleTasks: (tasks: Omit<Task, 'id' | 'completed'>[]) => void;
}

export default function TaskInputForm({ onAddTask, onAddMultipleTasks }: TaskInputFormProps) {
  const [activeTab, setActiveTab] = useState<'structured' | 'chaos'>('structured');
  
  // Structured form state
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState<TaskCategory>('assignment');
  const [notes, setNotes] = useState('');

  // Chaos dump state
  const [chaosText, setChaosText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<Omit<Task, 'id' | 'completed'>[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStructuredSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;
    
    onAddTask({
      title: title.trim(),
      deadline,
      category,
      notes: notes.trim(),
    });

    setTitle('');
    setDeadline('');
    setCategory('assignment');
    setNotes('');
  };

  const handleParseChaos = async () => {
    if (!chaosText.trim()) return;
    setIsParsing(true);
    setErrorMsg('');
    setParsedPreview([]);

    try {
      const response = await fetch('/api/parse-chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: chaosText,
          currentTime: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse unstructured text. Ensure your server is running.');
      }

      const data = await response.json();
      if (data.parsedTasks && Array.isArray(data.parsedTasks)) {
        setParsedPreview(data.parsedTasks);
      } else {
        setErrorMsg('The AI was unable to structure your text. Try being slightly more specific about deadlines.');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'An error occurred while connecting to the parser server.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImportParsed = () => {
    if (parsedPreview.length === 0) return;
    onAddMultipleTasks(parsedPreview);
    setParsedPreview([]);
    setChaosText('');
    setActiveTab('structured');
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300" id="task-input-container">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900/40">
        <button
          id="tab-structured"
          onClick={() => { setActiveTab('structured'); setErrorMsg(''); }}
          className={`flex-1 py-3 px-4 text-xs font-bold tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'structured'
              ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-950 border-b-2 border-indigo-650 dark:border-indigo-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100/50 dark:hover:bg-zinc-900/30'
          }`}
        >
          <Plus className="w-4 h-4" />
          Single Task Add
        </button>
        <button
          id="tab-chaos"
          onClick={() => { setActiveTab('chaos'); setErrorMsg(''); }}
          className={`flex-1 py-3 px-4 text-xs font-bold tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'chaos'
              ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-950 border-b-2 border-indigo-650 dark:border-indigo-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100/50 dark:hover:bg-zinc-900/30'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400 animate-pulse" />
          AI Chaos Dump
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'structured' ? (
          <form onSubmit={handleStructuredSubmit} className="space-y-4.5" id="structured-add-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Chemistry Lab Report, Pitch Deck..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-3xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-3xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-500" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-3xs"
                >
                  <option value="assignment" className="dark:bg-zinc-900">📚 Assignment</option>
                  <option value="exam" className="dark:bg-zinc-900">✏️ Exam / Test</option>
                  <option value="meeting" className="dark:bg-zinc-900">💼 Meeting / Interview</option>
                  <option value="bill" className="dark:bg-zinc-900">💵 Bill Payment</option>
                  <option value="other" className="dark:bg-zinc-900">🎯 Goal / Commitment</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
                  Context / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Worth 15%, ask Sarah for outline, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-3xs"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-add-task-structured"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-xs hover:shadow-indigo-100 dark:hover:shadow-none transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Task & Create Plan
            </button>
          </form>
        ) : (
          <div className="space-y-4.5" id="chaos-dump-container">
            <div>
              <p className="text-slate-500 dark:text-zinc-400 text-xs mb-3 font-medium leading-relaxed">
                Type or paste whatever chaos is in your head, syllabus, Slack, or inbox.
                Our AI will instantly parse names, categorize them, and suggest accurate deadlines.
              </p>
              <textarea
                placeholder="Example: Chemistry lab paper due Wednesday 9am, electric bill is due in 2 hours, team sync on Friday at noon."
                value={chaosText}
                onChange={(e) => setChaosText(e.target.value)}
                rows={4}
                className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-3 text-sm text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none shadow-3xs"
              />
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-3.5 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleParseChaos}
              disabled={isParsing || !chaosText.trim()}
              id="btn-parse-chaos"
              className="w-full bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-zinc-800 font-bold text-sm py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shadow-xs"
            >
              {isParsing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-650 dark:border-indigo-400 border-t-transparent"></div>
                  Sorting out the chaos...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Parse into Tasks
                </>
              )}
            </button>

            {parsedPreview.length > 0 && (
              <div className="mt-4 border-t border-slate-100 dark:border-zinc-800/80 pt-4 space-y-3" id="chaos-preview-section">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    Parsed AI Preview ({parsedPreview.length})
                  </h4>
                  <button
                    onClick={handleImportParsed}
                    id="btn-import-parsed-tasks"
                    className="bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border border-indigo-200/50 dark:border-indigo-900/50"
                  >
                    Import All Into List
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                  {parsedPreview.map((item, index) => (
                    <div key={index} className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/60 rounded-xl p-3.5 relative hover:border-slate-350 dark:hover:border-zinc-750 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">
                              {item.category === 'assignment' ? '📚' :
                               item.category === 'exam' ? '✏️' :
                               item.category === 'meeting' ? '💼' :
                               item.category === 'bill' ? '💵' : '🎯'}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200 text-sm truncate">{item.title}</span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1 pl-4 font-medium">
                              <CornerDownRight className="w-3 h-3 flex-shrink-0 text-slate-400" />
                              {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 rounded text-slate-500 dark:text-zinc-400 shadow-3xs">
                            Due: {new Date(item.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
