import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, spacing } from '@/lib/theme';

type Slice = { value: number; color: string; label: string };

type Props = {
  slices: Slice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSub?: string;
};

export function DonutChart({
  slices,
  size = 160,
  strokeWidth = 24,
  centerLabel,
  centerSub,
}: Props) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${cx}, ${cy}`}>
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={colors.surfaceLight}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {total > 0 &&
            slices.map((slice, i) => {
              const pct = slice.value / total;
              const dash = pct * circumference;
              const gap = circumference - dash;
              const el = (
                <Circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += dash;
              return el;
            })}
        </G>
      </Svg>
      {(centerLabel || centerSub) && (
        <View style={[styles.center, { width: size, height: size }]}>
          {centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
          {centerSub && <Text style={styles.centerSub}>{centerSub}</Text>}
        </View>
      )}
    </View>
  );
}

export function ChartLegend({ slices }: { slices: Slice[] }) {
  return (
    <View style={styles.legend}>
      {slices.map((s, i) => (
        <View key={i} style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: s.color }]} />
          <Text style={styles.legendLabel}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: { color: colors.text, fontSize: 22, fontWeight: '700' },
  centerSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  legend: { marginTop: spacing.md, gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: colors.textMuted, fontSize: 14 },
});
