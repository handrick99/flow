import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData, useTimerTick } from '@/lib/hooks';
import { startTimer, stopTimer, toggleChecklist, deleteLog } from '@/lib/storage';
import {
  todayString,
  formatDuration,
  minutesToHours,
} from '@/lib/utils';
import { colors, spacing, WAKING_HOURS } from '@/lib/theme';
import { TimerCard } from '@/components/TimerCard';
import { DonutChart, ChartLegend } from '@/components/DonutChart';
import { BarChart } from '@/components/BarChart';
import { ChecklistRow } from '@/components/ChecklistRow';
import { Section, Card } from '@/components/Section';

export default function TodayScreen() {
  const today = todayString();
  const { data, loading, setAndSave, refresh } = useAppData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isRunning = !!data?.activeTimer;
  useTimerTick(isRunning);

  const elapsedSeconds = useMemo(() => {
    if (!data?.activeTimer) return 0;
    return Math.floor((Date.now() - data.activeTimer.startedAt) / 1000);
  }, [data?.activeTimer, isRunning]);

  const todayLogs = useMemo(
    () => data?.logs.filter((l) => l.date === today) ?? [],
    [data?.logs, today]
  );

  const spentMinutes = useMemo(
    () => todayLogs.reduce((s, l) => s + l.durationMinutes, 0),
    [todayLogs]
  );

  const wakingMinutes = WAKING_HOURS * 60;
  const remainingMinutes = Math.max(0, wakingMinutes - spentMinutes);

  const activityBreakdown = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    for (const log of todayLogs) {
      map.set(log.activityId, (map.get(log.activityId) ?? 0) + log.durationMinutes);
    }
    return data.activities
      .map((a) => ({
        value: map.get(a.id) ?? 0,
        color: a.color,
        label: `${a.name} · ${formatDuration(map.get(a.id) ?? 0)}`,
      }))
      .filter((s) => s.value > 0);
  }, [data, todayLogs]);

  const hoursLeftSlices = useMemo(
    () => [
      { value: spentMinutes, color: colors.accent, label: `Tracked · ${formatDuration(spentMinutes)}` },
      { value: remainingMinutes, color: colors.surfaceLight, label: `Remaining · ${formatDuration(remainingMinutes)}` },
    ],
    [spentMinutes, remainingMinutes]
  );

  const goalProgress = useMemo(() => {
    if (!data) return [];
    return data.activities.map((a) => {
      const done = todayLogs
        .filter((l) => l.activityId === a.id)
        .reduce((s, l) => s + l.durationMinutes, 0);
      return {
        label: a.name.slice(0, 3),
        value: minutesToHours(done),
        color: a.color,
        sub: `${Math.min(100, Math.round((done / a.targetMinutes) * 100))}%`,
      };
    });
  }, [data, todayLogs]);

  const activeActivity = data?.activities.find(
    (a) => a.id === data.activeTimer?.activityId
  );

  if (loading || !data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Flow</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        <Section title="Timer">
          <TimerCard
            activity={activeActivity}
            elapsedSeconds={elapsedSeconds}
            isRunning={isRunning}
            selectedId={selectedId ?? data.activities[0]?.id ?? null}
            onSelect={setSelectedId}
            activities={data.activities}
            onStart={async (id) => {
              const next = await startTimer(data, id);
              setAndSave(next);
            }}
            onStop={async () => {
              const next = await stopTimer(data, today);
              await setAndSave(next);
              await refresh();
            }}
          />
        </Section>

        <Section title="Hours left today">
          <Card>
            <View style={styles.chartRow}>
              <DonutChart
                slices={hoursLeftSlices}
                centerLabel={`${minutesToHours(remainingMinutes)}h`}
                centerSub="remaining"
              />
              <ChartLegend slices={hoursLeftSlices} />
            </View>
            <Text style={styles.hint}>
              Based on {WAKING_HOURS} waking hours · {formatDuration(spentMinutes)} tracked
            </Text>
          </Card>
        </Section>

        <Section title="Time spent">
          <Card>
            {activityBreakdown.length > 0 ? (
              <View style={styles.chartRow}>
                <DonutChart
                  slices={activityBreakdown}
                  centerLabel={formatDuration(spentMinutes)}
                  centerSub="total"
                />
                <ChartLegend slices={activityBreakdown} />
              </View>
            ) : (
              <Text style={styles.empty}>Start the timer to see your breakdown</Text>
            )}
          </Card>
        </Section>

        <Section title="Daily goals">
          <Card>
            <BarChart bars={goalProgress} maxValue={4} />
          </Card>
        </Section>

        <Section title="Daily checklist">
          <View style={styles.checklist}>
            {data.checklist.map((item) => (
              <ChecklistRow
                key={item.id}
                title={item.title}
                done={item.completedDates.includes(today)}
                onToggle={async () => {
                  const next = await toggleChecklist(data, item.id, today);
                  setAndSave(next);
                }}
              />
            ))}
          </View>
        </Section>

        {todayLogs.length > 0 && (
          <Section title="Today's log">
            <View style={styles.checklist}>
              {[...todayLogs].reverse().map((log) => {
                const act = data.activities.find((a) => a.id === log.activityId);
                return (
                  <View key={log.id} style={styles.logRow}>
                    <View style={[styles.logDot, { backgroundColor: act?.color }]} />
                    <Text style={styles.logName}>{act?.name ?? 'Unknown'}</Text>
                    <Text style={styles.logDur}>{formatDuration(log.durationMinutes)}</Text>
                    <Pressable
                      onPress={async () => {
                        const next = await deleteLog(data, log.id);
                        setAndSave(next);
                      }}
                    >
                      <Text style={styles.logDelete}>×</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
  },
  date: { color: colors.textMuted, fontSize: 15, marginBottom: spacing.lg },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
  checklist: { gap: spacing.sm },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logName: { color: colors.text, flex: 1, fontSize: 15 },
  logDur: { color: colors.textMuted, fontSize: 14 },
  logDelete: { color: colors.danger, fontSize: 22, paddingHorizontal: 8 },
});
