import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius } from '@/lib/theme';
import { formatTimer } from '@/lib/utils';
import { Activity } from '@/lib/types';

type Props = {
  activity: Activity | undefined;
  elapsedSeconds: number;
  isRunning: boolean;
  onStart: (activityId: string) => void;
  onStop: () => void;
  activities: Activity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function TimerCard({
  activity,
  elapsedSeconds,
  isRunning,
  onStart,
  onStop,
  activities,
  selectedId,
  onSelect,
}: Props) {
  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRunning) {
      onStop();
    } else if (selectedId) {
      onStart(selectedId);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.time}>{formatTimer(elapsedSeconds)}</Text>
      <Text style={styles.activityName}>
        {isRunning && activity ? activity.name : 'Select an activity'}
      </Text>

      {!isRunning && (
        <View style={styles.chips}>
          {activities.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => onSelect(a.id)}
              style={[
                styles.chip,
                { borderColor: a.color },
                selectedId === a.id && { backgroundColor: a.color + '33' },
              ]}
            >
              <View style={[styles.chipDot, { backgroundColor: a.color }]} />
              <Text style={styles.chipText}>{a.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        onPress={handleToggle}
        disabled={!isRunning && !selectedId}
        style={[
          styles.button,
          isRunning ? styles.stopBtn : styles.startBtn,
          !isRunning && !selectedId && styles.disabled,
        ]}
      >
        <Ionicons
          name={isRunning ? 'stop' : 'play'}
          size={28}
          color={colors.text}
        />
        <Text style={styles.buttonText}>{isRunning ? 'Stop' : 'Start'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  time: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  activityName: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
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
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { color: colors.text, fontSize: 13 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  startBtn: { backgroundColor: colors.accentDim },
  stopBtn: { backgroundColor: colors.danger },
  disabled: { opacity: 0.4 },
  buttonText: { color: colors.text, fontSize: 17, fontWeight: '600' },
});
