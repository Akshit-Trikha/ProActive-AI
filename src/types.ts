export type TaskCategory = 'assignment' | 'exam' | 'meeting' | 'bill' | 'other';

export interface AIAnalysis {
  calculatedPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  urgencyScore: number; // 1 to 100
  hoursRemaining: number;
  substeps: string[];
  timeEstimate: string;
}

export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO date-time string
  category: TaskCategory;
  notes: string;
  completed: boolean;
  aiAnalysis?: AIAnalysis;
  substepProgress?: { [substepIndex: number]: boolean }; // tracks completed status of AI substeps
}

export interface ScheduleItem {
  timeSlot: string;
  taskTitle: string;
  focusInstruction: string;
}

export interface AnalysisResponse {
  analyzedTasks: {
    id: string;
    calculatedPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    urgencyScore: number;
    hoursRemaining: number;
    substeps: string[];
    timeEstimate: string;
  }[];
  schedule: ScheduleItem[];
  productivityRecommendations: string[];
  motivationalSpeech: string;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
  completedToday: boolean;
}
