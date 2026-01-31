// src/types.ts

export interface BaseStep {
  type: 'exercise' | 'rest' | 'repetition';
}

export interface ExerciseStep extends BaseStep {
  type: 'exercise';
  name: string;
  duration: number; // in seconds
  description?: string;
}

export interface RestStep extends BaseStep {
  type: 'rest';
  duration: number; // in seconds
}

export interface RepetitionStep extends BaseStep {
  type: 'repetition';
  count: number;
  steps: WorkoutStep[];
  // TODO Remove since unused.
  duration: number; // in seconds
}

export type WorkoutStep = ExerciseStep | RestStep | RepetitionStep;

export interface Workout {
  id: string;
  name: string;
  steps: WorkoutStep[];
}

export interface WorkoutData {
  workouts: Workout[];
}
