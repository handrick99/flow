import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '@/lib/hooks';
import {
  updateActivities,
  updateChecklist,
  addManualLog,
  generateId,
} from '@/lib/storage';
import { todayString, formatDuration } from '@/lib/utils';
import { colors, spacing, radius, ACTIVITY_COLORS } from '@/lib/theme';
import { Activity, ChecklistItem } from '@/lib/types';
import { Section, Card } from '@/components/Section';

export default function GoalsScreen() {
  const today = todayString();
  const { data, loading, setAndSave } = useAppData();
  const [newActivity, setNewActivity] = useState('');
  const [newChecklist, setNewChecklist] = useState('');
  const [manualActivityId, setManualActivityId] = useState<string | null>(null);
  const [manualMinutes, setManualMinutes] = useState('30');

  if (loading || !data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const addActivity = async () => {
    const name = newActivity.trim();
    if (!name) return;
    const color = ACTIVITY_COLORS[data.activities.length % ACTIVITY_COLORS.length];
    const activity: Activity = {
      id: generateId(),
      name,
      color,
      targetMinutes: 60,
    };
    const next = await updateActivities(data, [...data.activities, activity]);
    setAndSave(next);
    setNewActivity('');
  };

  const removeActivity = (id: string) => {
    Alert.alert('Remove activity?', 'Logs for this activity will remain.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const next = await updateActivities(
            data,
            data.activities.filter((a) => a.id !== id)
          );
          setAndSave(next);
        },
      },
    ]);
  };

  const updateTarget = async (id: string, targetMinutes: number) => {
    const activities = data.activities.map((a) =>
      a.id === id ? { ...a, targetMinutes } : a
    );
    const next = await updateActivities(data, activities);
    setAndSave(next);
  };

  const addChecklistItem = async () => {
    const title = newChecklist.trim();
    if (!title) return;
    const item: ChecklistItem = {
      id: generateId(),
      title,
      completedDates: [],
    };
    const next = await updateChecklist(data, [...data.checklist, item]);
    setAndSave(next);
    setNewChecklist('');
  };

  const removeChecklistItem = async (id: string) => {
    const next = await updateChecklist(
      data,
      data.checklist.filter((c) => c.id !== id)
    );
    setAndSave(next);
  };

  const logManual = async () => {
    const mins = parseInt(manualMinutes, 10);
    const actId = manualActivityId ?? data.activities[0]?.id;
    if (!actId || !mins || mins <= 0) return;
    const next = await addManualLog(data, actId, mins, today);
    setAndSave(next);
    Alert.alert('Logged', `${formatDuration(mins)} added for today`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Goals</Text>
        <Text style={styles.sub}>Activities, daily targets & habits</Text>

        <Section title="Quick log">
          <Card>
            <Text style={styles.label}>Activity</Text>
            <View style={styles.chips}>
              {data.activities.map((a) => (
                <Pressable
                  key={a.id}
                  onPress={() => setManualActivityId(a.id)}
                  style={[
                    styles.chip,
                    (manualActivityId ?? data.activities[0]?.id) === a.id &&
                      styles.chipActive,
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: a.color }]} />
                  <Text style={styles.chipText}>{a.name}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>Minutes</Text>
            <TextInput
              style={styles.input}
              value={manualMinutes}
              onChangeText={setManualMinutes}
              keyboardType="number-pad"
              placeholderTextColor={colors.textMuted}
            />
            <Pressable style={styles.addBtn} onPress={logManual}>
              <Text style={styles.addBtnText}>Log time</Text>
            </Pressable>
          </Card>
        </Section>

        <Section title="Daily activities">
          <View style={styles.list}>
            {data.activities.map((a) => (
              <Card key={a.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <View style={[styles.dot, { backgroundColor: a.color }]} />
                  <Text style={styles.activityName}>{a.name}</Text>
                  <Pressable onPress={() => removeActivity(a.id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>
                <Text style={styles.label}>Daily target (minutes)</Text>
                <View style={styles.targetRow}>
                  {[30, 60, 120, 240].map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => updateTarget(a.id, m)}
                      style={[
                        styles.targetChip,
                        a.targetMinutes === m && styles.targetChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.targetChipText,
                          a.targetMinutes === m && styles.targetChipTextActive,
                        ]}
                      >
                        {m < 60 ? `${m}m` : `${m / 60}h`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Card>
            ))}
          </View>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="New activity..."
              placeholderTextColor={colors.textMuted}
              value={newActivity}
              onChangeText={setNewActivity}
              onSubmitEditing={addActivity}
            />
            <Pressable style={styles.iconBtn} onPress={addActivity}>
              <Ionicons name="add" size={24} color={colors.text} />
            </Pressable>
          </View>
        </Section>

        <Section title="Daily checklist">
          <View style={styles.list}>
            {data.checklist.map((item) => (
              <View key={item.id} style={styles.checkRow}>
                <Text style={styles.checkTitle}>{item.title}</Text>
                <Pressable onPress={() => removeChecklistItem(item.id)}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
            ))}
          </View>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="New daily habit..."
              placeholderTextColor={colors.textMuted}
              value={newChecklist}
              onChangeText={setNewChecklist}
              onSubmitEditing={addChecklistItem}
            />
            <Pressable style={styles.iconBtn} onPress={addChecklistItem}>
              <Ionicons name="add" size={24} color={colors.text} />
            </Pressable>
          </View>
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
  list: { gap: spacing.sm },
  label: { color: colors.textMuted, fontSize: 12, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  iconBtn: {
    backgroundColor: colors.accentDim,
    borderRadius: radius.md,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    backgroundColor: colors.accentDim,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addBtnText: { color: colors.text, fontWeight: '600', fontSize: 16 },
  activityCard: { marginBottom: 0 },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  activityName: { color: colors.text, fontSize: 16, fontWeight: '600', flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  targetRow: { flexDirection: 'row', gap: spacing.sm },
  targetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetChipActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  targetChipText: { color: colors.textMuted, fontSize: 13 },
  targetChipTextActive: { color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accentDim + '44', borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 13 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkTitle: { color: colors.text, flex: 1, fontSize: 15 },
});
