// src/WorkoutRunner.tsx

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Workout, WorkoutStep } from './types';
import { calculateTotalWorkoutDuration, formatTimeLeft } from './utils';

interface WorkoutRunnerProps {
  workout: Workout;
  onFinish: () => void;
  onEnd: () => void;
}

function WorkoutRunner({ workout, onFinish, onEnd }: WorkoutRunnerProps) {
    // State variables
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(true);
    const [countdown, setCountdown] = useState(0); // Initialize here, will be set by effect

    // Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const wakeLock = useRef<WakeLockSentinel | null>(null);

    type FlattenedWorkoutStep = {
      step: WorkoutStep;
      sectionName?: string;
    };

    useEffect(() => {
      const manageWakeLock = async () => {
        if ('wakeLock' in navigator) {
          if (!isPaused) {
            try {
              wakeLock.current = await navigator.wakeLock.request('screen');
            } catch (err) {
              console.error(`Failed to acquire wake lock: ${err}`);
            }
          } else {
            if (wakeLock.current) {
              wakeLock.current.release();
              wakeLock.current = null;
            }
          }
        }
      };

      manageWakeLock();

      return () => {
        if (wakeLock.current) {
          wakeLock.current.release();
        }
      };
    }, [isPaused]);

    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && !isPaused && 'wakeLock' in navigator) {
          navigator.wakeLock.request('screen').then(lock => {
            wakeLock.current = lock;
          }).catch(err => {
            console.error(`Failed to re-acquire wake lock: ${err}`);
          });
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, [isPaused]);

    // Memoized computation for allSteps
    const allSteps: FlattenedWorkoutStep[] = useMemo(() => {
      const flattenSteps = (steps: WorkoutStep[], sectionName?: string): FlattenedWorkoutStep[] => {
        let flattened: FlattenedWorkoutStep[] = [];
        steps.forEach(step => {
          if (step.type === 'repetition') {
            for (let i = 0; i < step.count; i++) {
              flattened = flattened.concat(flattenSteps(step.steps, sectionName));
              if (i < step.count - 1 && step.restBetweenReps) {
                flattened.push({ step: { type: 'rest', duration: step.restBetweenReps }, sectionName });
              }
            }
          } else {
            flattened.push({ step, sectionName });
          }
        });
        return flattened;
      };

      if (workout.sections) {
        return workout.sections.flatMap(section => flattenSteps(section.steps, section.name));
      } else if (workout.steps) {
        return flattenSteps(workout.steps);
      }
      return [];
    }, [workout]);

    // Derived state (re-calculated on every render if dependencies change)
    const currentFlattenedStep: FlattenedWorkoutStep | undefined = allSteps[currentStepIndex];
    const currentStep: WorkoutStep | undefined = currentFlattenedStep?.step;
    const currentSectionName: string | undefined = currentFlattenedStep?.sectionName;

    // Memoized callback for triggerFeedback
    const triggerFeedback = useCallback(async () => { // Make it async
        // Always play sound
        if (!audioContextRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = context;
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        const context = audioContextRef.current;

        // --- NEW AUDIO PLAYBACK LOGIC ---
        if (!audioBufferRef.current) {
            try {
                const response = await fetch(`${import.meta.env.BASE_URL}bell.mp3`); // Use base URL for correct path
                const arrayBuffer = await response.arrayBuffer();
                audioBufferRef.current = await context.decodeAudioData(arrayBuffer);
            } catch (error) {
                console.error("Error loading bell.mp3:", error);
                // Fallback to oscillator if MP3 fails to load
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(context.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, context.currentTime);
                gainNode.gain.setValueAtTime(0.5, context.currentTime);
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.15);
                return; // Stop here if fallback is used
            }
        }

        const source = context.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(context.destination);
        source.start(0);
        // --- END NEW AUDIO PLAYBACK LOGIC ---

        // Additionally vibrate if supported
        if ('vibrate' in navigator) {
            navigator.vibrate(200); // Vibrate for 200ms
        }
    }, [audioContextRef, audioBufferRef]);

    // Memoized callback for handlePlayPause
    const handlePlayPause = useCallback(async () => {
      if (!audioContextRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = context;
      }
      if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
      }
      // Removed: if (isPaused) { await triggerFeedback(); }
      setIsPaused(!isPaused);
    }, [audioContextRef, isPaused, setIsPaused]);

    // Memoized callback for handlePrevious
    const handlePrevious = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => {
                const newIndex = prev - 1;
                setCountdown(allSteps[newIndex]?.step.duration ?? 0);
                return newIndex;
            });
            setIsPaused(true); // Pause when navigating
        }
    }, [currentStepIndex, allSteps, setCountdown, setIsPaused]);

    // Memoized callback for handleNext
    const handleNext = useCallback(() => {
        if (currentStepIndex < allSteps.length - 1) {
            setCurrentStepIndex(prev => {
                const newIndex = prev + 1;
                setCountdown(allSteps[newIndex]?.step.duration ?? 0);
                return newIndex;
            });
            setIsPaused(true); // Pause when navigating
        } else {
            onFinish();
        }
    }, [currentStepIndex, allSteps, setCountdown, setIsPaused, onFinish]);

    // Effects
    useEffect(() => {
        // Initializes countdown to the first step's duration
        // Resets countdown whenever currentStep changes (e.g., via handlePrevious/handleNext)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCountdown(currentStep?.duration ?? 0);
    }, [currentStep, setCountdown]);

    useEffect(() => {
        if (isPaused || !currentStep) {
            return;
        }

        if (countdown === 0) {
            const advance = async () => {
                await triggerFeedback();
                if (currentStepIndex < allSteps.length - 1) {
                    const nextStep = allSteps[currentStepIndex + 1];
                    // Batch state updates for next step's countdown and index
                    setCountdown(nextStep.step.duration);
                    setCurrentStepIndex(prev => prev + 1);
                } else {
                    onFinish(); // Last step finished
                }
            };
            advance();
            return;
        }

        const timer = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isPaused, countdown, currentStep, currentStepIndex, allSteps, onFinish, triggerFeedback, setCountdown, setCurrentStepIndex]);

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            handlePrevious();
            break;
          case 'ArrowRight':
            event.preventDefault();
            handleNext();
            break;
          case 'Escape':
            event.preventDefault();
            if (window.confirm('Are you sure you want to end the workout?')) {
              onEnd();
            }
            break;
          case ' ': // Spacebar
            event.preventDefault();
            handlePlayPause();
            break;
          default:
            break;
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [handlePrevious, handleNext, handlePlayPause, onEnd]);

    const nextStepPreview = useMemo(() => {
      if (currentStepIndex < allSteps.length - 1) {
        return allSteps[currentStepIndex + 1]?.step;
      }
      return null;
    }, [allSteps, currentStepIndex]);

    const {
      totalWorkoutDuration,
      elapsedDuration,
    } = useMemo(() => {
      const totalDuration = calculateTotalWorkoutDuration(workout);
      const elapsed = allSteps.slice(0, currentStepIndex).reduce((acc, curr) => acc + curr.step.duration, 0);
      return {
        totalWorkoutDuration: totalDuration,
        elapsedDuration: elapsed,
      };
    }, [workout, currentStepIndex, allSteps]);

    const remainingTimeInSeconds = totalWorkoutDuration - elapsedDuration;
    const progressPercentage = totalWorkoutDuration > 0 ? (elapsedDuration / totalWorkoutDuration) * 100 : 0;

    // Render logic below
  if (!currentStep) {
    return <div>Workout Complete!</div>;
  }

  return (
    <div className="workout-runner">
      <h1>{workout.name}</h1>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
        <div className="progress-bar-text">
          {`${Math.round(progressPercentage)}% (${formatTimeLeft(remainingTimeInSeconds)} left)`}
        </div>
      </div>

      {currentSectionName && (
        <h3 className="current-section-name">{currentSectionName}</h3>
      )}

      <div className="current-step">
        <h2>{currentStep.type === 'exercise' ? currentStep.name : 'Rest'}</h2>
        <div className={`countdown-container ${isPaused ? 'paused' : ''}`}>
          <p className="countdown">{countdown}</p>
          {isPaused && <div className="pause-overlay"></div>}
        </div>
        {currentStep.type === 'exercise' && currentStep.description && (
            <p className="exercise-description">{currentStep.description}</p>
        )}
      </div>

      {nextStepPreview && (
        <div className="next-exercise-preview">
          <h4>Next:</h4>
          <p>{nextStepPreview.type === 'exercise' ? nextStepPreview.name : 'Rest'}</p>
        </div>
      )}

      <div className="controls">
        <button onClick={handlePrevious} disabled={currentStepIndex === 0} className="nav-button">Previous</button>
        <button onClick={handlePlayPause}>
          {isPaused ? 'Start' : 'Pause'}
        </button>
        <button onClick={handleNext} disabled={currentStepIndex === allSteps.length - 1} className="nav-button">Next</button>
      </div>
      <button className="end-workout" onClick={() => {
        if (window.confirm('Are you sure you want to end the workout?')) {
          onEnd();
        }
      }}>End Workout</button>
    </div>
  );
}

export default WorkoutRunner;
