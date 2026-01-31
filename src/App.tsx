// src/App.tsx

import { useState, useEffect } from 'react';
import type { Workout, WorkoutData, WorkoutStep } from './types';
import WorkoutRunner from './WorkoutRunner';
import WorkoutOverview from './WorkoutOverview';
import './App.css';
import './WorkoutRunner.css';
import './WorkoutOverview.css';

export const _calculateStepsDuration = (steps: WorkoutStep[]): number => {
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

const calculateTotalWorkoutDuration = (workout: Workout): number => {
  if (workout.sections) {
    return workout.sections.reduce((total, section) => {
      return total + _calculateStepsDuration(section.steps);
    }, 0);
  } else if (workout.steps) {
    return _calculateStepsDuration(workout.steps);
  }
  return 0;
};

const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};


function App() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);

  useEffect(() => {
    fetch('/workouts-app-new/workouts.json')
      .then((response) => response.json())
      .then((data: WorkoutData) => setWorkouts(data.workouts))
      .catch((error) => console.error('Error fetching workouts:', error));
  }, []);

  const handleSelectWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setIsWorkoutStarted(false);
  }

  const handleStartWorkout = () => {
    setIsWorkoutStarted(true);
  }

  const handleBackToSelection = () => {
    setSelectedWorkout(null);
  }

  const handleWorkoutFinish = () => {
    setSelectedWorkout(null);
    setIsWorkoutStarted(false);
  }

  if (selectedWorkout) {
    if (isWorkoutStarted) {
      return (
        <div className="App">
          <WorkoutRunner
            workout={selectedWorkout}
            onFinish={handleWorkoutFinish}
          />
        </div>
      );
    } else {
      return (
        <div className="App">
          <WorkoutOverview
            workout={selectedWorkout}
            onStart={handleStartWorkout}
            onBack={handleBackToSelection}
            formatDuration={formatDuration}
          />
        </div>
      )
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Select a Workout</h1>
      </header>
      <div className="workout-list">
        {workouts.map((workout) => {
          const totalDuration = calculateTotalWorkoutDuration(workout);
          const formattedDuration = formatDuration(totalDuration);
          return (
            <button key={workout.id} onClick={() => handleSelectWorkout(workout)}>
              <div className="workout-name">{workout.name}</div>
              <div className="workout-duration">{formattedDuration}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default App;