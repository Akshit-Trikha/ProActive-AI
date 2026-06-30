import { useState, FormEvent } from 'react';
import { Flame, Check, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { Habit } from '../types';

interface HabitsTrackerProps {
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onAddHabit: (name: string) => void;
  onDeleteHabit: (id: string) => void;
}

export default function HabitsTracker({ habits, onToggleHabit, onAddHabit, onDeleteHabit }: HabitsTrackerProps) {
  const [newHabitName, setNewHabitName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName.trim());
    setNewHabitName('');
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl p-6 shadow-xs" id="habits-section">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-200 dark:border-zinc-850 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Daily Panic-Prevention Habits</h3>
          <p className="text-xs text-slate-550 dark:text-zinc-400 mt-1 font-medium leading-relaxed">
            Build consistency with small daily rituals to stop last-minute crises before they start.
          </p>
        </div>
        
        {/* Simple inline form to add custom habit */}
        <form onSubmit={handleSubmit} className="w-full sm:w-auto flex gap-2">
          <input
            type="text"
            required
            placeholder="e.g., Drink water, Stretch"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all w-full sm:w-48"
          />
          <button
            type="submit"
            id="btn-add-habit"
            className="bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-indigo-250 dark:border-indigo-900/40 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Add Ritual
          </button>
        </form>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-zinc-550 text-xs font-medium">
          No prevention habits set yet. Add some rituals above!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="habits-grid">
          {habits.map((habit) => {
            const isDone = habit.completedToday;
            return (
              <div
                key={habit.id}
                id={`habit-card-${habit.id}`}
                className={`border rounded-2xl p-4 transition-all duration-300 flex items-center justify-between ${
                  isDone
                    ? 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30 shadow-3xs'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 shadow-3xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleHabit(habit.id)}
                    id={`btn-toggle-habit-${habit.id}`}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      isDone
                        ? 'bg-emerald-105 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 border-emerald-500'
                        : 'border-slate-300 dark:border-zinc-700 hover:border-indigo-600 text-transparent bg-slate-50 dark:bg-zinc-800'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  
                  <div>
                    <span className={`text-xs sm:text-sm font-bold block ${
                      isDone ? 'text-slate-400 dark:text-zinc-500 line-through' : 'text-slate-850 dark:text-zinc-100'
                    }`}>
                      {habit.name}
                    </span>
                    
                    <div className="flex items-center gap-1 mt-1">
                      <Flame className={`w-3.5 h-3.5 ${habit.streak > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-300 dark:text-zinc-700'}`} />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                        {habit.streak} Day Streak
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteHabit(habit.id)}
                  id={`btn-delete-habit-${habit.id}`}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Proactive Tip Card */}
      <div className="mt-6 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/60 dark:border-zinc-850 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
          <span className="font-bold text-slate-800 dark:text-zinc-200">Pro-Tip for Procrastinators:</span> Your brain tries to protect you from stressful tasks by triggering avoidance. Completing just one tiny habit (like drinking a glass of water or setting up your desk) resets your amygdala, signaling that you are in control.
        </div>
      </div>
    </div>
  );
}
