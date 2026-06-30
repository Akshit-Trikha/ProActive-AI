import { useState, useEffect } from 'react';
import { 
  Sparkles, AlertTriangle, RefreshCw, X, Copy, Check, Info, Bell, ShieldAlert, Zap, Flame, Sun, Moon,
  LayoutDashboard, MessageSquare, Activity, BookOpen
} from 'lucide-react';
import TaskInputForm from './components/TaskInputForm';
import AIPrioritizer from './components/AIPrioritizer';
import AIBriefing from './components/AIBriefing';
import HabitsTracker from './components/HabitsTracker';
import AIChatCoach from './components/AIChatCoach';
import { Task, ScheduleItem, Habit, AnalysisResponse } from './types';

// Default starter prevention habits
const DEFAULT_HABITS: Habit[] = [
  { id: '1', name: 'Check syllabus or work calendar', streak: 0, completedToday: false },
  { id: '2', name: 'Clear desk of non-essential items', streak: 0, completedToday: false },
  { id: '3', name: 'Turn off phone notifications (DND)', streak: 0, completedToday: false },
  { id: '4', name: 'Drink a full glass of water & stretch', streak: 0, completedToday: false },
];

export default function App() {
  // --- Lazy Local Storage State Initialization ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('lastminute_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('lastminute_habits');
    if (saved) {
      const parsed: Habit[] = JSON.parse(saved);
      // Reset completion state if a new day has arrived
      const todayStr = new Date().toISOString().split('T')[0];
      return parsed.map(h => {
        if (h.lastCompletedDate && h.lastCompletedDate !== todayStr) {
          // Check if streak is broken (more than 1 day difference)
          const lastDate = new Date(h.lastCompletedDate);
          const todayDate = new Date(todayStr);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          return {
            ...h,
            completedToday: false,
            streak: diffDays > 1 ? 0 : h.streak
          };
        }
        return h;
      });
    }
    return DEFAULT_HABITS;
  });

  const [chatHistory, setChatHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('lastminute_chat');
    return saved ? JSON.parse(saved) : [];
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('lastminute_schedule');
    return saved ? JSON.parse(saved) : [];
  });

  const [recommendations, setRecommendations] = useState<string[]>(() => {
    const saved = localStorage.getItem('lastminute_recs');
    return saved ? JSON.parse(saved) : [];
  });

  const [motivationalSpeech, setMotivationalSpeech] = useState<string>(() => {
    return localStorage.getItem('lastminute_speech') || '';
  });

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('lastminute_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('lastminute_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'coach' | 'habits' | 'about'>('dashboard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingChat, setIsGeneratingChat] = useState(false);
  const [criticalTaskText, setCriticalTaskText] = useState<string | null>(null);

  // Helper Modal state
  const [helperModalOpen, setHelperModalOpen] = useState(false);
  const [helperLoading, setHelperLoading] = useState(false);
  const [helperOutput, setHelperOutput] = useState('');
  const [helperTitle, setHelperTitle] = useState('');
  const [copied, setCopied] = useState(false);

  // --- Local Storage Synchronization ---
  useEffect(() => {
    localStorage.setItem('lastminute_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('lastminute_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('lastminute_chat', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem('lastminute_schedule', JSON.stringify(schedule));
    localStorage.setItem('lastminute_recs', JSON.stringify(recommendations));
    localStorage.setItem('lastminute_speech', motivationalSpeech);
  }, [schedule, recommendations, motivationalSpeech]);

  // --- Check for Urgent Commitments ---
  useEffect(() => {
    const checkUrgentTasks = () => {
      const now = new Date().getTime();
      const urgent = tasks.find(t => {
        if (t.completed) return false;
        const diff = new Date(t.deadline).getTime() - now;
        return diff > 0 && diff < 2 * 60 * 60 * 1000; // less than 2 hours
      });

      if (urgent) {
        setCriticalTaskText(`CRITICAL COMMITTMENT DETECTED: "${urgent.title}" is due very soon! Beat paralysis. Click expanded details to grab starter checklists or listen to your high-energy briefing now.`);
      } else {
        setCriticalTaskText(null);
      }
    };

    checkUrgentTasks();
    const interval = setInterval(checkUrgentTasks, 60000); // check every minute
    return () => clearInterval(interval);
  }, [tasks]);

  // --- Task Operations ---
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'completed'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: Date.now().toString(),
      completed: false,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const handleAddMultipleTasks = (parsedTasks: Omit<Task, 'id' | 'completed'>[]) => {
    const newTasks: Task[] = parsedTasks.map((t, idx) => ({
      ...t,
      id: (Date.now() + idx).toString(),
      completed: false,
    }));
    setTasks(prev => [...newTasks, ...prev]);
  };

  const handleToggleComplete = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleSubstep = (taskId: string, index: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const currentProgress = t.substepProgress || {};
        return {
          ...t,
          substepProgress: {
            ...currentProgress,
            [index]: !currentProgress[index]
          }
        };
      }
      return t;
    }));
  };

  // --- AI Priority & Plan Auditing ---
  const handleAnalyzeAll = async () => {
    const activeTasks = tasks.filter(t => !t.completed);
    if (activeTasks.length === 0) {
      alert("Please add at least one active task to conduct an audit!");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: activeTasks.map(t => ({
            id: t.id,
            title: t.title,
            deadline: t.deadline,
            category: t.category,
            notes: t.notes
          })),
          currentTime: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to run task analysis. Check server log.');
      }

      const data: AnalysisResponse = await response.json();
      
      // Update individual task's priority and substeps
      setTasks(prev => prev.map(task => {
        const matchingAnalysis = data.analyzedTasks.find(a => a.id === task.id);
        if (matchingAnalysis) {
          return {
            ...task,
            aiAnalysis: {
              calculatedPriority: matchingAnalysis.calculatedPriority,
              urgencyScore: matchingAnalysis.urgencyScore,
              hoursRemaining: matchingAnalysis.hoursRemaining,
              substeps: matchingAnalysis.substeps,
              timeEstimate: matchingAnalysis.timeEstimate
            },
            // Reset substeps checkmarks if new ones are generated
            substepProgress: {}
          };
        }
        return task;
      }));

      // Update schedule & suggestions
      setSchedule(data.schedule || []);
      setRecommendations(data.productivityRecommendations || []);
      setMotivationalSpeech(data.motivationalSpeech || '');

    } catch (error: any) {
      console.error(error);
      alert(error.message || 'An error occurred while connecting to the AI analyzer.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Habit Tracker Operations ---
  const handleToggleHabit = (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id === id) {
        const isNowCompleted = !h.completedToday;
        return {
          ...h,
          completedToday: isNowCompleted,
          lastCompletedDate: isNowCompleted ? todayStr : h.lastCompletedDate,
          streak: isNowCompleted ? h.streak + 1 : Math.max(0, h.streak - 1)
        };
      }
      return h;
    }));
  };

  const handleAddHabit = (name: string) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      streak: 0,
      completedToday: false
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // --- AI Chat Coach Session ---
  const handleSendMessage = async (text: string) => {
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user' as const,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setIsGeneratingChat(true);

    try {
      const response = await fetch('/api/chat-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatHistory.map(m => ({ sender: m.sender, text: m.text }))
        }),
      });

      if (!response.ok) {
        throw new Error('Connection lost with focus coach. Ensure server is running.');
      }

      const data = await response.json();
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant' as const,
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error(error);
      const errMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant' as const,
        text: `Error: ${error.message || 'Unable to connect to your Coach right now. Please ensure your environment is running.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, errMessage]);
    } finally {
      setIsGeneratingChat(false);
    }
  };

  const handleClearHistory = () => {
    setChatHistory([]);
  };

  // --- AI Action Helper Modal ---
  const handleOpenHelper = async (
    task: Task, 
    actionType: 'extension_request' | 'task_breakdown' | 'draft_starter' | 'tactical_tips'
  ) => {
    const titles = {
      extension_request: `AI Drafted Extension Request for "${task.title}"`,
      task_breakdown: `Detailed Plan Breakdown for "${task.title}"`,
      draft_starter: `Writer's Block Starter Draft for "${task.title}"`,
      tactical_tips: `Tactical advice for finishing "${task.title}"`
    };

    setHelperTitle(titles[actionType]);
    setHelperModalOpen(true);
    setHelperLoading(true);
    setHelperOutput('');
    setCopied(false);

    try {
      const response = await fetch('/api/help-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.title,
          deadline: task.deadline,
          actionType,
          notes: task.notes
        }),
      });

      if (!response.ok) {
        throw new Error('Server returned an error generating draft.');
      }

      const data = await response.json();
      setHelperOutput(data.output || 'No template generated.');
    } catch (error: any) {
      console.error(error);
      setHelperOutput(`Failed to contact the AI Generator. Error details: ${error.message || 'Server offline'}.`);
    } finally {
      setHelperLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(helperOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans" id="app-root-container">
      {/* Flashing Urgent Alert Banner */}
      {criticalTaskText && (
        <div className="bg-red-50 border-b border-red-100 p-3.5 text-center flex items-center justify-center gap-3 animate-pulse" id="critical-alert-banner">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs sm:text-sm font-bold text-red-800 leading-snug">
            {criticalTaskText}
          </p>
        </div>
      )}

      {/* Main Header Nav */}
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-2 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-100 dark:shadow-none w-10 h-10 transition-transform hover:scale-105">
              <Zap className="w-5 h-5 fill-indigo-100 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                ProActive AI
                <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  AI Companion
                </span>
              </h1>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-0.5">AI-Proactive Planning Active</p>
            </div>
          </div>

          {/* Navigation & Theme Toggle */}
          <div className="flex items-center gap-3">
            <nav className="flex items-center bg-slate-100 dark:bg-zinc-900 p-1 border border-slate-200 dark:border-zinc-800 rounded-xl" id="main-nav-tabs">
              <button
                onClick={() => setActiveTab('dashboard')}
                id="nav-btn-dashboard"
                className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'dashboard'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('coach')}
                id="nav-btn-coach"
                className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'coach'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>AI Focus Coach</span>
              </button>
              <button
                onClick={() => setActiveTab('habits')}
                id="nav-btn-habits"
                className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'habits'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Habit Streaks</span>
              </button>
              <button
                onClick={() => setActiveTab('about')}
                id="nav-btn-about"
                className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'about'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Project Spec</span>
              </button>
            </nav>

            <button
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              id="theme-toggle-btn"
              className="p-2 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-zinc-800 cursor-pointer flex items-center justify-center transition-all h-9 w-9"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5 text-amber-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8" id="dashboard-view-content">
            {/* Split layout: Inputs left, tasklists/timelines right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Task Capture */}
              <div className="lg:col-span-4 space-y-6">
                <TaskInputForm 
                  onAddTask={handleAddTask} 
                  onAddMultipleTasks={handleAddMultipleTasks} 
                />

                {/* Micro Streaks Widget for context */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                    Ritual Streaks Check-In
                  </h4>
                  <div className="space-y-2.5">
                    {habits.slice(0, 3).map((h) => (
                      <div key={h.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-xs text-slate-700 font-medium truncate">{h.name}</span>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-0.5 border border-amber-200/50">
                          {h.streak}🔥
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Checklists */}
              <div className="lg:col-span-8 space-y-8">
                <AIPrioritizer
                  tasks={tasks}
                  onToggleComplete={handleToggleComplete}
                  onDeleteTask={handleDeleteTask}
                  onToggleSubstep={handleToggleSubstep}
                  onOpenHelper={handleOpenHelper}
                  onAnalyzeAll={handleAnalyzeAll}
                  isAnalyzing={isAnalyzing}
                />
              </div>

            </div>

            {/* Overall Timeline briefing */}
            <div className="border-t border-slate-200 pt-8">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Live AI Action Timeline & Recommendations
              </h2>
              <AIBriefing
                schedule={schedule}
                recommendations={recommendations}
                motivationalSpeech={motivationalSpeech}
              />
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE CHAT COACH */}
        {activeTab === 'coach' && (
          <div className="max-w-4xl mx-auto" id="coach-view-content">
            <AIChatCoach
              chatHistory={chatHistory}
              onSendMessage={handleSendMessage}
              isGenerating={isGeneratingChat}
              onClearHistory={handleClearHistory}
            />
          </div>
        )}

        {/* TAB 3: DAILY PREVENTATIVE HABITS */}
        {activeTab === 'habits' && (
          <div className="max-w-5xl mx-auto" id="habits-view-content">
            <HabitsTracker
              habits={habits}
              onToggleHabit={handleToggleHabit}
              onAddHabit={handleAddHabit}
              onDeleteHabit={handleDeleteHabit}
            />
          </div>
        )}

        {/* TAB 4: ABOUT & PROJECT INFO */}
        {activeTab === 'about' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in" id="about-view-content">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
                ProActive AI Specifications
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Official architecture, problem definition, and tech stack details.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Project Description Card */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      <Zap className="w-5 h-5" />
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm uppercase tracking-wider">Project Description</h3>
                  </div>
                  <p className="text-slate-650 dark:text-zinc-300 text-xs leading-relaxed">
                    <strong>ProActive AI</strong> is an intelligent cognitive assistant and productivity ecosystem engineered to preempt procrastination and empower professionals, students, and high-stress teams to intercept looming deadlines. Merging reactive task tracking with proactive executive function assistance, ProActive AI transforms overwhelming checklists into manageable, dynamic, action-oriented schedules, complete with immersive text-to-speech vocal briefings and supportive coaching.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                  <span>Product: ProActive AI</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">Active</span>
                </div>
              </div>

              {/* Problem Statement Selected Card */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                      <ShieldAlert className="w-5 h-5" />
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm uppercase tracking-wider">Problem Statement</h3>
                  </div>
                  <p className="text-slate-650 dark:text-zinc-300 text-xs leading-relaxed">
                    Procrastination and late-stage panic are universal cognitive challenges stemming from planning fallacy, choice paralysis, and emotional avoidance. Traditional task managers act as passive repositories, relying entirely on the user's intrinsic executive functioning, which frequently collapses under acute stress. This creates a destructive loop where tasks are continuously delayed until they become urgent, culminating in late-night work, heightened anxiety, compromised output quality, and burnout.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500">
                  <span>Focus Area: Cognitive Load & Burnout</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">Critical Priority</span>
                </div>
              </div>

              {/* Solution Overview Card */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-2xl p-6 shadow-xs md:col-span-2">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm uppercase tracking-wider">Solution Overview</h3>
                </div>
                <p className="text-slate-650 dark:text-zinc-300 text-xs leading-relaxed">
                  <strong>ProActive AI</strong> breaks this cognitive avoidance cycle by acting as an <em>active, predictive intervention partner</em>. Instead of waiting for users to initiate work, ProActive AI immediately processes chaotic workloads, breaks intimidating projects down into granular, low-friction subtasks, and dynamically populates a high-efficiency timeline. It integrates custom habit trackers to fortify ritual execution before work begins, uses natural speech synthesis for audible morning briefings, and deploys an interactive AI Focus Coach to unblock paralysis and sustain cognitive momentum.
                </p>
              </div>

              {/* Key Features Card */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-2xl p-6 shadow-xs md:col-span-2">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Activity className="w-5 h-5" />
                  </span>
                  <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm uppercase tracking-wider">Key Features</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-250 mb-1">Deep Task Breakdown</h4>
                    <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-normal">
                      Automatically parses, prioritizes, and decomposes complex or vague tasks into clear, low-friction, high-velocity subtasks.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-250 mb-1">Interactive AI Timelines</h4>
                    <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-normal">
                      Builds a step-by-step chronological blueprint for the day, prioritizing urgent deadlines and suggesting healthy breaks.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-250 mb-1">AI Vocal Briefing (TTS)</h4>
                    <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-normal">
                      Synthesizes high-fidelity audible schedules and motivational coaching using advanced generative speech patterns.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-250 mb-1">Cognitive Focus Coach</h4>
                    <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-normal">
                      A real-time chat partner that helps users overcome executive dysfunction and work through specific technical blocks.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-250 mb-1">Preventative Rituals</h4>
                    <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-normal">
                      Tracks core foundational habits (e.g., silencing phone, stretching) to cultivate optimal physiological and focus states.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/40 rounded-xl border border-slate-100 dark:border-zinc-800/80">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-250 mb-1">Offline State Sync</h4>
                    <p className="text-slate-500 dark:text-zinc-400 text-[11px] leading-normal">
                      Persists all sessions, schedule recommendations, and chat history locally within the browser.
                    </p>
                  </div>
                </div>
              </div>

              {/* Technologies Used Card */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                      <LayoutDashboard className="w-5 h-5" />
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm uppercase tracking-wider">Technologies Used</h3>
                  </div>
                  <ul className="space-y-2 text-slate-650 dark:text-zinc-300 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-0.5">•</span>
                      <span><strong>React 18+ with TypeScript</strong> for robust, type-safe frontend application architecture.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-0.5">•</span>
                      <span><strong>Tailwind CSS</strong> for fully responsive adaptive layouts supporting dark and light mode themes.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-0.5">•</span>
                      <span><strong>Web Audio API (AudioContext)</strong> with raw 16-bit PCM buffer processing.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold mt-0.5">•</span>
                      <span><strong>State Persistence</strong> via browser local storage serialization to preserve application state offline.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Google Technologies Utilized Card */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-sm uppercase tracking-wider">Google Technologies</h3>
                  </div>
                  <ul className="space-y-2 text-slate-650 dark:text-zinc-300 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 font-bold mt-0.5">•</span>
                      <span><strong>Google Gemini 3.5 Flash Model</strong> powers the core cognitive intelligence, task decomposition, and focus coaching.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 font-bold mt-0.5">•</span>
                      <span><strong>Google Gemini 3.1 Flash Text-to-Speech (TTS Preview)</strong> delivers native, high-fidelity raw audio streams (`audio/L16` at 24kHz).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-500 font-bold mt-0.5">•</span>
                      <span><strong>Google AI Studio Developer Framework</strong> leverages the official `@google/genai` TypeScript SDK server-side.</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer info line */}
      <footer className="border-t border-slate-200 bg-white py-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-medium">
          <p>© 2026 ProActive AI. Designed using Google Gemini 3.5 & React.</p>
          <p className="flex items-center gap-1 text-slate-400">
            <Info className="w-3.5 h-3.5" />
            Runs client-side state with server-side AI proxy. All sessions auto-saved in browser.
          </p>
        </div>
      </footer>

      {/* --- Renders the AI Helper Draft/Outline Modal --- */}
      {helperModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" id="helper-modal-overlay">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
              <h3 className="text-sm font-bold text-slate-800 truncate pr-4">{helperTitle}</h3>
              <button
                onClick={() => setHelperModalOpen(false)}
                id="btn-close-helper-modal"
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 text-slate-700 leading-relaxed text-sm" id="helper-modal-body">
              {helperLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3.5">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                  <p className="text-xs font-semibold text-slate-500">AI is drafting customized content for you...</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words font-mono bg-white p-4 rounded-xl border border-slate-250 max-h-96 overflow-y-auto text-xs text-slate-600">
                  {helperOutput}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setHelperModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200/55"
              >
                Cancel
              </button>
              
              {!helperLoading && helperOutput && (
                <button
                  onClick={copyToClipboard}
                  id="btn-copy-helper-draft"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Draft Content
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
