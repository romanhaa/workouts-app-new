// src/App.tsx

import { useState, useEffect } from 'react';
import type { Workout, WorkoutData } from './types';
import WorkoutRunner from './WorkoutRunner';
import WorkoutOverview from './WorkoutOverview';
import WorkoutFinished from './WorkoutFinished';
import { calculateTotalWorkoutDuration, formatDuration } from './utils';
import './App.css';
import './WorkoutRunner.css';
import './WorkoutOverview.css';
import './WorkoutFinished.css';


function App() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [isWorkoutFinished, setIsWorkoutFinished] = useState(false);

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
    setIsWorkoutFinished(true);
    setIsWorkoutStarted(false);
  }

  const handleBackToWorkouts = () => {
    setSelectedWorkout(null);
    setIsWorkoutStarted(false);
    setIsWorkoutFinished(false);
  }

  if (isWorkoutFinished) {
    return (
      <div className="App">
        <WorkoutFinished onBackToWorkouts={handleBackToWorkouts} />
      </div>
    );
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