// src/utils.ts

import type { Workout, WorkoutStep } from './types';

const _calculateStepsDuration = (steps: WorkoutStep[]): number => {
  return steps.reduce((total, step) => {
    if (step.type === 'repetition') {
      const repetitionDuration = _calculateStepsDuration(step.steps);
      const restBetweenRepsDuration = step.restBetweenReps ? step.restBetweenReps * (step.count > 0 ? step.count - 1 : 0) : 0;
      return total + (repetitionDuration * step.count) + restBetweenRepsDuration;
    } else {
      return total + step.duration;
    }
  }, 0);
};

export const calculateTotalWorkoutDuration = (workout: Workout): number => {
  if (workout.sections) {
    return workout.sections.reduce((total, section) => {
      return total + _calculateStepsDuration(section.steps);
    }, 0);
  } else if (workout.steps) {
    return _calculateStepsDuration(workout.steps);
  }
  return 0;
};

export const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};