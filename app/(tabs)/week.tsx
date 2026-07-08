import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '@/lib/hooks';
import {
  getWeekDates,
  dayLabel,
  formatDuration,
  minutesToHours,
  todayString,
} from '@/lib/utils';
import { colors, spacing } from '@/lib/theme';
import { BarChart } from '@/components/BarChart';
import { DonutChart, ChartLegend } from '@/components/DonutChart';
import { Section, Card } from '@/components/Section';

export default function WeekScreen() {
  const { data, loading } = useAppData();
  const weekDates = getWeekDates();
  const today = todayString();

  const dailyTotals = useMemo(() => {
    if (!data) return [];
    return weekDates.map((date) => {
      const mins = data.logs
        .filter((l) => l.date === date)
        .reduce((s, l) => s + l.durationMinutes, 0);
      return {
        label: dayLabel(date),
        value: minutesToHours(mins),
        color: date === today ? colors.accent : colors.accentDim,
        sub: date === today ? 'today' : undefined,
      };
    });
  }, [data, weekDates, today]);

  const weekBreakdown = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    for (const log of data.logs) {
      if (!weekDates.includes(log.date)) continue;
      map.set(log.activityId, (map.get(log.activityId) ?? 0) + log.durationMinutes);
    }
    return data.activities
      .map((a) => ({
        value: map.get(a.id) ?? 0,
        color: a.color,
        label: `${a.name} · ${formatDuration(map.get(a.id) ?? 0)}`,
      }))
      .filter((s) => s.value > 0);
  }, [data, weekDates]);

  const weekTotal = weekBreakdown.reduce((s, b) => s + b.value, 0);
  const checklistStats = useMemo(() => {
    if (!data) return { done: 0, total: 0 };
    let done = 0;
    let total = 0;
    for (const date of weekDates) {
      for (const item of data.checklist) {
        total++;
        if (item.completedDates.includes(date)) done++;
      }
    }
    return { done, total };
  }, [data, weekDates]);

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
        <Text style={styles.heading}>Weekly Review</Text>
        <Text style={styles.sub}>
          {checklistStats.done}/{checklistStats.total} daily habits completed
        </Text>

        <Section title="Hours per day">
          <Card>
            <BarChart bars={dailyTotals} />
            <Text style={styles.total}>
              {minutesToHours(
                dailyTotals.reduce((s, b) => s + b.value * 60, 0)
              )}
              h tracked this week
            </Text>
          </Card>
        </Section>

        <Section title="Time by activity">
          <Card>
            {weekBreakdown.length > 0 ? (
              <View style={styles.chartRow}>
                <DonutChart
                  slices={weekBreakdown}
                  centerLabel={formatDuration(weekTotal)}
                  centerSub="this week"
                />
                <ChartLegend slices={weekBreakdown} />
              </View>
            ) : (
              <Text style={styles.empty}>No activity logged this week yet</Text>
            )}
          </Card>
        </Section>

        <Section title="Goal progress">
          <Card>
            {data.activities.map((a) => {
              const weekMins = data.logs
                .filter((l) => weekDates.includes(l.date) && l.activityId === a.id)
                .reduce((s, l) => s + l.durationMinutes, 0);
              const targetWeek = a.targetMinutes * 7;
              const pct = Math.min(100, Math.round((weekMins / targetWeek) * 100));
              return (
                <View key={a.id} style={styles.goalRow}>
                  <View style={styles.goalHeader}>
                    <View style={[styles.dot, { backgroundColor: a.color }]} />
                    <Text style={styles.goalName}>{a.name}</Text>
                    <Text style={styles.goalPct}>{pct}%</Text>
                  </View>
                  <View style={styles.goalTrack}>
                    <View
                      style={[
                        styles.goalFill,
                        { width: `${pct}%`, backgroundColor: a.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.goalSub}>
                    {formatDuration(weekMins)} / {formatDuration(targetWeek)} goal
                  </Text>
                </View>
              );
            })}
          </Card>
        </Section>
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
  heading: { color: colors.text, fontSize: 28, fontWeight: '700' },
  sub: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  total: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
  goalRow: { marginBottom: spacing.md },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  goalName: { color: colors.text, flex: 1, fontSize: 15 },
  goalPct: { color: colors.textMuted, fontSize: 14 },
  goalTrack: {
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalFill: { height: '100%', borderRadius: 3 },
  goalSub: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
});
