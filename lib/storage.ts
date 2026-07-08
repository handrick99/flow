import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppData,
  DEFAULT_ACTIVITIES,
  DEFAULT_CHECKLIST,
  ActiveTimer,
  Activity,
  ChecklistItem,
  TimeLog,
} from './types';

const STORAGE_KEY = '@flow/data';

const defaultData: AppData = {
  activities: DEFAULT_ACTIVITIES,
  logs: [],
  checklist: DEFAULT_CHECKLIST,
  activeTimer: null,
};

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultData };
    const parsed = JSON.parse(raw) as AppData;
    return {
      activities: parsed.activities?.length ? parsed.activities : defaultData.activities,
      logs: parsed.logs ?? [],
      checklist: parsed.checklist?.length ? parsed.checklist : defaultData.checklist,
      activeTimer: parsed.activeTimer ?? null,
    };
  } catch {
    return { ...defaultData };
  }
}

export async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createLog(
  activityId: string,
  startTime: number,
  endTime: number,
  date: string
): TimeLog {
  const durationMinutes = Math.round((endTime - startTime) / 60000);
  return {
    id: generateId(),
    activityId,
    startTime,
    endTime,
    durationMinutes: Math.max(1, durationMinutes),
    date,
  };
}

export async function startTimer(
  data: AppData,
  activityId: string
): Promise<AppData> {
  const next: AppData = {
    ...data,
    activeTimer: { activityId, startedAt: Date.now() },
  };
  await saveData(next);
  return next;
}

export async function stopTimer(data: AppData, date: string): Promise<AppData> {
  if (!data.activeTimer) return data;

  const log = createLog(
    data.activeTimer.activityId,
    data.activeTimer.startedAt,
    Date.now(),
    date
  );

  const next: AppData = {
    ...data,
    logs: [...data.logs, log],
    activeTimer: null,
  };
  await saveData(next);
  return next;
}

export async function addManualLog(
  data: AppData,
  activityId: string,
  durationMinutes: number,
  date: string
): Promise<AppData> {
  const now = Date.now();
  const log = createLog(activityId, now - durationMinutes * 60000, now, date);
  const next: AppData = { ...data, logs: [...data.logs, log] };
  await saveData(next);
  return next;
}

export async function deleteLog(data: AppData, logId: string): Promise<AppData> {
  const next: AppData = { ...data, logs: data.logs.filter((l) => l.id !== logId) };
  await saveData(next);
  return next;
}

export async function toggleChecklist(
  data: AppData,
  itemId: string,
  date: string
): Promise<AppData> {
  const checklist = data.checklist.map((item) => {
    if (item.id !== itemId) return item;
    const done = item.completedDates.includes(date);
    return {
      ...item,
      completedDates: done
        ? item.completedDates.filter((d) => d !== date)
        : [...item.completedDates, date],
    };
  });
  const next: AppData = { ...data, checklist };
  await saveData(next);
  return next;
}

export async function updateActivities(
  data: AppData,
  activities: Activity[]
): Promise<AppData> {
  const next: AppData = { ...data, activities };
  await saveData(next);
  return next;
}

export async function updateChecklist(
  data: AppData,
  checklist: ChecklistItem[]
): Promise<AppData> {
  const next: AppData = { ...data, checklist };
  await saveData(next);
  return next;
}
