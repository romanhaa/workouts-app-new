// src/WorkoutOverview.tsx
import type { Workout, WorkoutStep } from './types';
import { calculateTotalWorkoutDuration } from './utils';

interface WorkoutOverviewProps {
  workout: Workout;
  onStart: () => void;
  onBack: () => void;
  formatDuration: (seconds: number) => string;
}

const StepView = ({ step, formatDuration }: { step: WorkoutStep, formatDuration: (s: number) => string }) => {
  if (step.type === 'repetition') {
    return (
      <div className="step-repetition">
        <div className="step-repetition-header">Repeat {step.count} times</div>

        <div className="step-repetition-body">
          {step.steps.map((s, i) => <StepView key={i} step={s} formatDuration={formatDuration} />)}
        </div>
        {step.restBetweenReps && (
          <p className="repetition-rest">Rest: {formatDuration(step.restBetweenReps)}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`step ${step.type === 'rest' ? 'step-rest' : ''}`}>
      <div>
        <span>{step.type === 'exercise' ? step.name : 'Rest'}</span>
        {step.type === 'exercise' && step.description && (
          <p className="step-description">{step.description}</p>
        )}
      </div>
      <span>{formatDuration(step.duration)}</span>
    </div>
  );
};


function WorkoutOverview({ workout, onStart, onBack, formatDuration }: WorkoutOverviewProps) {
  return (
    <div className="workout-overview">
      <h1>{workout.name}</h1>
      <div className="controls">
        <button onClick={onBack}>Back</button>
        <button onClick={onStart}>Start Workout</button>
      </div>
      <div className="step-list">
        {workout.sections ? (
          workout.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="workout-section">
              <h3>{section.name} <span>({formatDuration(calculateTotalWorkoutDuration({ steps: section.steps }))} min)</span></h3>
              {section.steps.map((step, stepIndex) => (
                <StepView key={stepIndex} step={step} formatDuration={formatDuration} />
              ))}
            </div>
          ))
        ) : (
          workout.steps?.map((step, index) => (
            <StepView key={index} step={step} formatDuration={formatDuration} />
          ))
        )}
      </div>
    </div>
  );
}

export default WorkoutOverview;
