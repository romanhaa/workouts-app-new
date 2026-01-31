// src/App.tsx

import { useState, useEffect } from 'react';
import type { Workout, WorkoutData, WorkoutStep } from './types';
import WorkoutRunner from './WorkoutRunner';
import './App.css';
import './WorkoutRunner.css';

const calculateStepsDuration = (steps: WorkoutStep[]): number => {
  return steps.reduce((total, step) => {
    if (step.type === 'repetition') {
      const repetitionDuration = calculateStepsDuration(step.steps);
      return total + (repetitionDuration * step.count);
    } else {
      return total + step.duration;
    }
  }, 0);
};

const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};


function App() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    fetch('/workouts.json')
      .then((response) => response.json())
      .then((data: WorkoutData) => setWorkouts(data.workouts))
      .catch((error) => console.error('Error fetching workouts:', error));
  }, []);

  if (selectedWorkout) {
    return (
      <div className="App">
        <WorkoutRunner
          workout={selectedWorkout}
          onFinish={() => setSelectedWorkout(null)}
        />
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Select a Workout</h1>
      </header>
      <div className="workout-list">
        {workouts.map((workout) => {
          const totalDuration = calculateStepsDuration(workout.steps);
          const formattedDuration = formatDuration(totalDuration);
          return (
            <button key={workout.id} onClick={() => setSelectedWorkout(workout)}>
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