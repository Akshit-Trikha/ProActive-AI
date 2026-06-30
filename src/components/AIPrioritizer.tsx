import { useState } from 'react';
import { 
  CheckCircle2, Clock, Trash2, ListChecks, Mail, FileSignature, HelpCircle, Sparkles, 
  ChevronRight, Calendar, AlertTriangle, ArrowRight, BookOpen 
} from 'lucide-react';
import { Task, AIAnalysis } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AIPrioritizerProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onToggleSubstep: (taskId: string, index: number) => void;
  onOpenHelper: (task: Task, actionType: 'extension_request' | 'task_breakdown' | 'draft_starter' | 'tactical_tips') => void;
  onAnalyzeAll: () => void;
  isAnalyzing: boolean;
}

export default function AIPrioritizer({
  tasks,
  onToggleComplete,
  onDeleteTask,
  onToggleSubstep,
  onOpenHelper,
  onAnalyzeAll,
  isAnalyzing,
}: AIPrioritizerProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  // Group active tasks by calculated priority or use deadline to sort
  const sortedActiveTasks = [...activeTasks].sort((a, b) => {
    // If analyzed, sort by priority and score
    const pOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    if (a.aiAnalysis && b.aiAnalysis) {
      if (a.aiAnalysis.calculatedPriority !== b.aiAnalysis.calculatedPriority) {
        return pOrder[a.aiAnalysis.calculatedPriority] - pOrder[b.aiAnalysis.calculatedPriority];
      }
      return b.aiAnalysis.urgencyScore - a.aiAnalysis.urgencyScore;
    }
    // Otherwise fallback to deadline order
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const getPriorityColor = (priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (priority) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400',
          badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-350 border-red-200 dark:border-red-900/50',
          glow: 'shadow-xs shadow-red-50/50 dark:shadow-none',
          accent: 'border-l-4 border-l-red-500'
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400',
          badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-350 border-amber-200 dark:border-amber-900/50',
          glow: 'shadow-xs shadow-amber-50/50 dark:shadow-none',
          accent: 'border-l-4 border-l-amber-500'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400',
          badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-350 border-indigo-200 dark:border-indigo-900/50',
          glow: 'shadow-xs shadow-indigo-50/50 dark:shadow-none',
          accent: 'border-l-4 border-l-indigo-500'
        };
      case 'LOW':
        return {
          bg: 'bg-slate-50 dark:bg-zinc-900/20 border-slate-200 dark:border-zinc-800/30 text-slate-600 dark:text-zinc-400',
          badge: 'bg-slate-150 dark:bg-zinc-800/40 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800/50',
          glow: 'shadow-xs',
          accent: 'border-l-4 border-l-slate-400 dark:border-l-zinc-600'
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-zinc-900/20 border-slate-200 dark:border-zinc-800/30 text-slate-600 dark:text-zinc-400',
          badge: 'bg-slate-100 dark:bg-zinc-850 text-slate-650 dark:text-zinc-300 border-slate-200 dark:border-zinc-800/50',
          glow: '',
          accent: 'border-l-4 border-l-slate-300 dark:border-l-zinc-700'
        };
    }
  };

  const getCountdownString = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();

    if (diffMs <= 0) return 'Overdue! 🚨';

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHrs === 0) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} left`;
    }
    if (diffHrs > 48) {
      const days = Math.floor(diffHrs / 24);
      return `${days} day${days !== 1 ? 's' : ''} left`;
    }
    return `${diffHrs}h ${diffMins}m left`;
  };

  return (
    <div className="space-y-6" id="prioritizer-section">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-5 border border-slate-200 dark:border-zinc-850 rounded-2xl shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Commitments & Immediate Action Plans</h3>
          <p className="text-xs text-slate-550 dark:text-zinc-400 mt-1 font-medium leading-relaxed">
            Analyze your list to get customized, ultra-low-friction micro-steps and urgency scores.
          </p>
        </div>
        
        {activeTasks.length > 0 && (
          <button
            onClick={onAnalyzeAll}
            disabled={isAnalyzing}
            id="btn-analyze-ai"
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs hover:shadow-indigo-100 dark:hover:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                Analyzing Priorities...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                AI Priority Audit & Action Plans
              </>
            )}
          </button>
        )}
      </div>

      {sortedActiveTasks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-950 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <Clock className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-slate-800 dark:text-zinc-200 text-sm font-bold">No active commitments in your list yet.</p>
          <p className="text-slate-450 dark:text-zinc-550 text-xs mt-1">Add a single task or use the Chaos Dump to populate your schedule!</p>
        </div>
      ) : (
        <div className="space-y-3" id="active-tasks-list">
          <AnimatePresence>
            {sortedActiveTasks.map((task) => {
              const styles = getPriorityColor(task.aiAnalysis?.calculatedPriority);
              const countdown = getCountdownString(task.deadline);
              const isExpanded = expandedTaskId === task.id;
              
              // Calculate progress of AI substeps
              const totalSubsteps = task.aiAnalysis?.substeps.length || 0;
              const completedSubsteps = Object.values(task.substepProgress || {}).filter(Boolean).length;
              const progressPercent = totalSubsteps > 0 ? Math.round((completedSubsteps / totalSubsteps) * 100) : 0;

              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -15 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  key={task.id} 
                  className={`bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl transition-all duration-300 ${styles.glow} ${styles.accent}`}
                  id={`task-card-${task.id}`}
                >
                {/* Main Card Header Area */}
                <div className="p-4 sm:p-5 flex items-start gap-4 justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleComplete(task.id)}
                      id={`btn-complete-${task.id}`}
                      className="text-slate-400 hover:text-indigo-600 transition-colors mt-0.5 flex-shrink-0 cursor-pointer"
                    >
                      <div className="w-5.5 h-5.5 rounded-full border border-slate-300 hover:border-indigo-600 flex items-center justify-center transition-all bg-white shadow-3xs">
                        <CheckCircle2 className="w-4 h-4 text-transparent hover:text-indigo-600" />
                      </div>
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-sm">
                          {task.category === 'assignment' ? '📚' :
                           task.category === 'exam' ? '✏️' :
                           task.category === 'meeting' ? '💼' :
                           task.category === 'bill' ? '💵' : '🎯'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug break-words">
                          {task.title}
                        </h4>
                        
                        {task.aiAnalysis && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${styles.badge}`}>
                              {task.aiAnalysis.calculatedPriority}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1 bg-slate-100/60 dark:bg-zinc-800/40 border border-slate-200/30 px-2 py-0.5 rounded-md">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(task.deadline).toLocaleString([], { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>

                        <span className={`flex items-center gap-1 font-bold bg-slate-100/60 dark:bg-zinc-800/40 border border-slate-200/30 px-2 py-0.5 rounded-md ${
                          countdown.includes('min') || countdown.includes('h') || countdown.includes('Overdue')
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          {countdown}
                        </span>

                        {task.aiAnalysis?.timeEstimate && (
                          <span className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/50 px-2 py-0.5 rounded-md text-slate-600 dark:text-zinc-300 text-[10px] font-semibold">
                            Est: {task.aiAnalysis.timeEstimate}
                          </span>
                        )}
                      </div>

                      {/* Professional Urgency & Hours Indicator bar */}
                      {task.aiAnalysis && (
                        <div className="mt-3.5 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-150 dark:border-zinc-800/40 rounded-xl p-3 max-w-md">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">AI Urgency Rating</span>
                            <span className={`text-xs font-extrabold ${
                              task.aiAnalysis.calculatedPriority === 'CRITICAL' ? 'text-red-600 dark:text-red-400' :
                              task.aiAnalysis.calculatedPriority === 'HIGH' ? 'text-amber-600 dark:text-amber-400' :
                              task.aiAnalysis.calculatedPriority === 'MEDIUM' ? 'text-indigo-600 dark:text-indigo-400' :
                              'text-slate-500'
                            }`}>{task.aiAnalysis.urgencyScore}%</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-150 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  task.aiAnalysis.calculatedPriority === 'CRITICAL' ? 'bg-red-500 dark:bg-red-600' :
                                  task.aiAnalysis.calculatedPriority === 'HIGH' ? 'bg-amber-500' :
                                  task.aiAnalysis.calculatedPriority === 'MEDIUM' ? 'bg-indigo-500' :
                                  'bg-slate-400'
                                }`}
                                style={{ width: `${task.aiAnalysis.urgencyScore}%` }}
                              />
                            </div>
                            
                            {task.aiAnalysis.hoursRemaining !== undefined && (
                              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 whitespace-nowrap bg-slate-150 dark:bg-zinc-800/50 px-2 py-0.5 rounded">
                                {task.aiAnalysis.hoursRemaining > 24 
                                  ? `${Math.round(task.aiAnalysis.hoursRemaining / 24)}d left` 
                                  : `${Math.round(task.aiAnalysis.hoursRemaining)}h left`}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {task.notes && (
                        <p className="text-xs text-slate-600 dark:text-zinc-300 mt-2.5 bg-slate-50/50 dark:bg-zinc-900/10 p-2.5 rounded-xl border border-slate-150 dark:border-zinc-800">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      id={`btn-expand-${task.id}`}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                      title="Toggle Action Checklist"
                    >
                      <ListChecks className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      id={`btn-delete-${task.id}`}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer border border-transparent hover:border-red-100"
                      title="Remove Task"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Substeps Progress Bar (if analyzed) */}
                {task.aiAnalysis && totalSubsteps > 0 && !isExpanded && (
                  <div className="px-5 pb-4 pt-0 flex items-center gap-3">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      {completedSubsteps}/{totalSubsteps} steps
                    </span>
                  </div>
                )}

                {/* Expanded Action Center / Substeps Panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                    {/* Action Panel Title */}
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Execution Checklist
                      </h5>
                      {task.aiAnalysis && (
                        <span className="text-xs text-slate-500 font-bold">
                          Progress: {progressPercent}% ({completedSubsteps}/{totalSubsteps})
                        </span>
                      )}
                    </div>

                    {/* AI Substeps Checkbox List */}
                    {task.aiAnalysis ? (
                      <div className="space-y-2">
                        {task.aiAnalysis.substeps.map((step, idx) => {
                          const isStepCompleted = !!task.substepProgress?.[idx];
                          return (
                            <label
                              key={idx}
                              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                isStepCompleted
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                                  : 'bg-white border-slate-200 hover:border-slate-350 text-slate-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isStepCompleted}
                                onChange={() => onToggleSubstep(task.id, idx)}
                                className="mt-0.5 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-white border-slate-300 rounded"
                              />
                              <span className="text-xs sm:text-sm font-medium">{step}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-white border border-slate-200 rounded-xl">
                        <p className="text-slate-500 text-xs mb-3 font-medium">AI Substeps have not been generated for this task yet.</p>
                        <button
                          onClick={onAnalyzeAll}
                          disabled={isAnalyzing}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          Generate Steps Now <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Proactive Life Savers Buttons */}
                    <div className="border-t border-slate-200 pt-4">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        AI Productivity Launchpad
                      </span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        <button
                          onClick={() => onOpenHelper(task, 'extension_request')}
                          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 p-2.5 rounded-xl text-left flex flex-col gap-1.5 transition-all text-slate-700 group cursor-pointer shadow-3xs"
                        >
                          <Mail className="w-4 h-4 text-emerald-600 group-hover:scale-105 transition-transform" />
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-900 leading-tight">Extension Draft</span>
                            <span className="text-[9px] text-slate-400 leading-none">Ask for 24h elegantly</span>
                          </div>
                        </button>

                        <button
                          onClick={() => onOpenHelper(task, 'draft_starter')}
                          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 p-2.5 rounded-xl text-left flex flex-col gap-1.5 transition-all text-slate-700 group cursor-pointer shadow-3xs"
                        >
                          <FileSignature className="w-4 h-4 text-indigo-600 group-hover:scale-105 transition-transform" />
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-900 leading-tight">Starter Outline</span>
                            <span className="text-[9px] text-slate-400 leading-none">Beat writer's block</span>
                          </div>
                        </button>

                        <button
                          onClick={() => onOpenHelper(task, 'task_breakdown')}
                          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 p-2.5 rounded-xl text-left flex flex-col gap-1.5 transition-all text-slate-700 group cursor-pointer shadow-3xs"
                        >
                          <BookOpen className="w-4 h-4 text-sky-600 group-hover:scale-105 transition-transform" />
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-900 leading-tight">Detailed Plan</span>
                            <span className="text-[9px] text-slate-400 leading-none">Estimate exact minutes</span>
                          </div>
                        </button>

                        <button
                          onClick={() => onOpenHelper(task, 'tactical_tips')}
                          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 p-2.5 rounded-xl text-left flex flex-col gap-1.5 transition-all text-slate-700 group cursor-pointer shadow-3xs"
                        >
                          <HelpCircle className="w-4 h-4 text-amber-600 group-hover:scale-105 transition-transform" />
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-900 leading-tight">Tactical Advice</span>
                            <span className="text-[9px] text-slate-400 leading-none">High-pressure focus rules</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}

      {/* Completed Commitments Section */}
      {completedTasks.length > 0 && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            Saved & Completed ({completedTasks.length})
          </h4>
          <div className="space-y-2 opacity-75">
            <AnimatePresence>
              {completedTasks.map((task) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  key={task.id}
                  className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl p-3.5 sm:px-4 flex items-center justify-between shadow-3xs"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleComplete(task.id)}
                      className="text-indigo-600 cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 fill-indigo-50 dark:fill-indigo-950/20" />
                    </button>
                    <div>
                      <span className="text-sm font-bold text-slate-400 dark:text-zinc-500 line-through">{task.title}</span>
                      <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
                        Done: {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
