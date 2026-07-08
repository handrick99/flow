import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius } from '@/lib/theme';

type Props = {
  title: string;
  done: boolean;
  onToggle: () => void;
};

export function ChecklistRow({ title, done, onToggle }: Props) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onToggle();
      }}
      style={[styles.row, done && styles.rowDone]}
    >
      <Ionicons
        name={done ? 'checkbox' : 'square-outline'}
        size={24}
        color={done ? colors.success : colors.textMuted}
      />
      <Text style={[styles.title, done && styles.titleDone]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowDone: { opacity: 0.6 },
  title: { color: colors.text, fontSize: 16, flex: 1 },
  titleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
});
