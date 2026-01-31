// src/WorkoutFinished.tsx

interface WorkoutFinishedProps {
  onBackToWorkouts: () => void;
}

function WorkoutFinished({ onBackToWorkouts }: WorkoutFinishedProps) {
  return (
    <div className="workout-finished">
      <h1>Workout Complete!</h1>
      <button onClick={onBackToWorkouts}>Back to Workouts</button>
    </div>
  );
}

export default WorkoutFinished;
