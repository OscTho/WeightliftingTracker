export const MOVEMENT_CATEGORIES = [
  'Competition Lifts',
  'Snatch Variations',
  'Clean Variations',
  'Jerk Variations',
  'Squats',
  'Accessories',
] as const;

export const COMMON_MOVEMENT_IDS = [
  'snatch',
  'clean',
  'jerk',
  'back_squat',
  'front_squat',
  'clean_pull',
  'snatch_pull',
] as const;

export const ACCESSORY_EQUIPMENT_OPTIONS = [
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'bands', label: 'Bands' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
] as const;

export function accessoryEquipmentLabel(value?: string) {
  return ACCESSORY_EQUIPMENT_OPTIONS.find((option) => option.value === value)?.label ?? 'Equipment';
}

export const STANDARD_MOVEMENTS = [
  { id: 'snatch', name: 'Snatch', category: 'Competition Lifts' },
  { id: 'clean_and_jerk', name: 'Clean & Jerk', category: 'Competition Lifts' },
  { id: 'clean', name: 'Clean', category: 'Competition Lifts' },
  { id: 'jerk', name: 'Jerk', category: 'Competition Lifts' },
  { id: 'power_snatch', name: 'Power Snatch', category: 'Snatch Variations' },
  { id: 'hang_snatch', name: 'Hang Snatch', category: 'Snatch Variations' },
  { id: 'high_hang_snatch', name: 'High Hang Snatch', category: 'Snatch Variations' },
  { id: 'block_snatch', name: 'Block Snatch', category: 'Snatch Variations' },
  { id: 'muscle_snatch', name: 'Muscle Snatch', category: 'Snatch Variations' },
  { id: 'snatch_from_blocks', name: 'Snatch from Blocks', category: 'Snatch Variations' },
  { id: 'snatch_pull', name: 'Snatch Pull', category: 'Snatch Variations' },
  { id: 'snatch_high_pull', name: 'Snatch High Pull', category: 'Snatch Variations' },
  { id: 'snatch_balance', name: 'Snatch Balance', category: 'Snatch Variations' },
  { id: 'overhead_squat', name: 'Overhead Squat', category: 'Snatch Variations' },
  { id: 'power_clean', name: 'Power Clean', category: 'Clean Variations' },
  { id: 'hang_clean', name: 'Hang Clean', category: 'Clean Variations' },
  { id: 'high_hang_clean', name: 'High Hang Clean', category: 'Clean Variations' },
  { id: 'block_clean', name: 'Block Clean', category: 'Clean Variations' },
  { id: 'muscle_clean', name: 'Muscle Clean', category: 'Clean Variations' },
  { id: 'clean_from_blocks', name: 'Clean from Blocks', category: 'Clean Variations' },
  { id: 'clean_pull', name: 'Clean Pull', category: 'Clean Variations' },
  { id: 'clean_high_pull', name: 'Clean High Pull', category: 'Clean Variations' },
  { id: 'clean_deadlift', name: 'Clean Deadlift', category: 'Clean Variations' },
  { id: 'power_jerk', name: 'Power Jerk', category: 'Jerk Variations' },
  { id: 'push_jerk', name: 'Push Jerk', category: 'Jerk Variations' },
  { id: 'split_jerk', name: 'Split Jerk', category: 'Jerk Variations' },
  { id: 'hang_jerk', name: 'Hang Jerk', category: 'Jerk Variations' },
  { id: 'jerk_from_blocks', name: 'Jerk from Blocks', category: 'Jerk Variations' },
  { id: 'jerk_balance', name: 'Jerk Balance', category: 'Jerk Variations' },
  { id: 'tall_jerk', name: 'Tall Jerk', category: 'Jerk Variations' },
  { id: 'jerk_dip', name: 'Jerk Dip', category: 'Jerk Variations' },
  { id: 'jerk_drive', name: 'Jerk Drive', category: 'Jerk Variations' },
  { id: 'back_squat', name: 'Back Squat', category: 'Squats' },
  { id: 'front_squat', name: 'Front Squat', category: 'Squats' },
  { id: 'pause_back_squat', name: 'Pause Back Squat', category: 'Squats' },
  { id: 'pause_front_squat', name: 'Pause Front Squat', category: 'Squats' },
  { id: 'tempo_back_squat', name: 'Tempo Back Squat', category: 'Squats' },
  { id: 'tempo_front_squat', name: 'Tempo Front Squat', category: 'Squats' },
  { id: 'romanian_deadlift', name: 'Romanian Deadlift', category: 'Accessories' },
  { id: 'deadlift', name: 'Deadlift', category: 'Accessories' },
  { id: 'good_morning', name: 'Good Morning', category: 'Accessories' },
  { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', category: 'Accessories' },
  { id: 'walking_lunge', name: 'Walking Lunge', category: 'Accessories' },
  { id: 'reverse_lunge', name: 'Reverse Lunge', category: 'Accessories' },
  { id: 'step_up', name: 'Step-Up', category: 'Accessories' },
  { id: 'hip_thrust', name: 'Hip Thrust', category: 'Accessories' },
  { id: 'nordic_curl', name: 'Nordic Curl', category: 'Accessories' },
  { id: 'back_extension', name: 'Back Extension', category: 'Accessories' },
] as const;

export const movementLabels = Object.fromEntries(
  STANDARD_MOVEMENTS.map((movement) => [movement.id, movement.name]),
) as Record<string, string>;

export function movementLabel(id: string) {
  return movementLabels[id] ?? id.replace(/_/g, ' ');
}