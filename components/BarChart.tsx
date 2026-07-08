import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '@/lib/theme';

type Bar = { label: string; value: number; color?: string; sub?: string };

type Props = {
  bars: Bar[];
  maxValue?: number;
  height?: number;
};

export function BarChart({ bars, maxValue, height = 120 }: Props) {
  const max = maxValue ?? Math.max(...bars.map((b) => b.value), 1);

  return (
    <View style={styles.container}>
      <View style={[styles.bars, { height }]}>
        {bars.map((bar, i) => {
          const pct = max > 0 ? bar.value / max : 0;
          return (
            <View key={i} style={styles.barCol}>
              <Text style={styles.barValue}>
                {bar.value > 0 ? bar.value.toFixed(1) : ''}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      flex: Math.max(pct, bar.value > 0 ? 0.04 : 0),
                      backgroundColor: bar.color ?? colors.accent,
                    },
                  ]}
                />
                {bar.value === 0 && <View style={{ flex: 1 }} />}
              </View>
              <Text style={styles.barLabel}>{bar.label}</Text>
              {bar.sub && <Text style={styles.barSub}>{bar.sub}</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  barCol: { flex: 1, alignItems: 'center' },
  barValue: {
    color: colors.textMuted,
    fontSize: 10,
    marginBottom: 4,
    height: 14,
  },
  barTrack: {
    width: '100%',
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: radius.sm,
    minHeight: 0,
  },
  barLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
  },
  barSub: {
    color: colors.textMuted,
    fontSize: 9,
    opacity: 0.7,
  },
});
