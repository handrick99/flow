export type Activity = {
  id: string;
  name: string;
  color: string;
  targetMinutes: number;
};

export type TimeLog = {
  id: string;
  activityId: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  date: string;
};

export type ChecklistItem = {
  id: string;
  title: string;
  completedDates: string[];
};

export type ActiveTimer = {
  activityId: string;
  startedAt: number;
};

export type AppData = {
  activities: Activity[];
  logs: TimeLog[];
  checklist: ChecklistItem[];
  activeTimer: ActiveTimer | null;
};

export const DEFAULT_ACTIVITIES: Activity[] = [
  { id: '1', name: 'Deep Work', color: '#818cf8', targetMinutes: 240 },
  { id: '2', name: 'Exercise', color: '#34d399', targetMinutes: 60 },
  { id: '3', name: 'Learning', color: '#fbbf24', targetMinutes: 60 },
  { id: '4', name: 'Social', color: '#f87171', targetMinutes: 60 },
];

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'c1', title: 'Morning routine', completedDates: [] },
  { id: 'c2', title: 'Review goals', completedDates: [] },
  { id: 'c3', title: 'Evening reflection', completedDates: [] },
];
