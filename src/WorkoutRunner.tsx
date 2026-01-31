// src/WorkoutRunner.tsx

import { useState, useEffect, useRef } from 'react';
import type { Workout, WorkoutStep } from './types';

interface WorkoutRunnerProps {
  workout: Workout;
  onFinish: () => void;
}

function WorkoutRunner({ workout, onFinish }: WorkoutRunnerProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(true);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);

    type FlattenedWorkoutStep = {
      step: WorkoutStep;
      sectionName?: string;
    };

    const allSteps: FlattenedWorkoutStep[] = [];

    if (workout.sections) {
      workout.sections.forEach(section => {
        section.steps.forEach(s => {
          if (s.type === 'repetition') {
            for (let i = 0; i < s.count; i++) {
              s.steps.forEach(repStep => allSteps.push({ step: repStep, sectionName: section.name }));
              if (i < s.count - 1 && s.restBetweenReps) {
                allSteps.push({ step: { type: 'rest', duration: s.restBetweenReps }, sectionName: section.name });
              }
            }
          } else {
            allSteps.push({ step: s, sectionName: section.name });
          }
        });
      });
    } else if (workout.steps) {
      workout.steps.forEach(s => {
        if (s.type === 'repetition') {
            for (let i = 0; i < s.count; i++) {
                s.steps.forEach(repStep => allSteps.push({ step: repStep }));
                if (i < s.count - 1 && s.restBetweenReps) {
                    allSteps.push({ step: { type: 'rest', duration: s.restBetweenReps } });
                }
            }
        } else {
            allSteps.push({ step: s });
        }
      });
    }
    const currentFlattenedStep: FlattenedWorkoutStep | undefined = allSteps[currentStepIndex];
    const currentStep: WorkoutStep | undefined = currentFlattenedStep?.step;
    const currentSectionName: string | undefined = currentFlattenedStep?.sectionName;

    const [countdown, setCountdown] = useState(currentStep?.duration ?? 0);

    const triggerFeedback = async () => { // Make it async
        // Always play sound
        if (!audioContextRef.current) {
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
    };

    useEffect(() => {
        setCountdown(currentStep?.duration ?? 0);
    }, [currentStep]);


    useEffect(() => {
        if (isPaused || !currentStep) return;

        if (countdown === 0) {
            const giveFeedback = async () => {
                await triggerFeedback();
            };
            giveFeedback();
            if (currentStepIndex < allSteps.length - 1) {
                setCurrentStepIndex(currentStepIndex + 1);
            } else {
                onFinish();
            }
            return;
        }

        const timer = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown, isPaused, currentStep, currentStepIndex, allSteps.length, onFinish]);


  if (!currentStep) {
    return <div>Workout Complete!</div>;
  }

  const progress = (currentStepIndex / allSteps.length) * 100;

  const handlePlayPause = async () => {
    if (!audioContextRef.current) {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;
    }
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
    if (isPaused) {
        await triggerFeedback();
    }
    setIsPaused(!isPaused);
  }

  return (
    <div className="workout-runner">
      <h1>{workout.name}</h1>
      <div className="progress-bar">
        <div style={{ width: `${progress}%` }} />
      </div>

      {currentSectionName && (
        <h3 className="current-section-name">{currentSectionName}</h3>
      )}

      <div className="current-step">
        <h2>{currentStep.type === 'exercise' ? currentStep.name : 'Rest'}</h2>
        <p className="countdown">{countdown}</p>
        {currentStep.type === 'exercise' && currentStep.description && (
            <p className="exercise-description">{currentStep.description}</p>
        )}
      </div>

      <div className="controls">
        <button onClick={handlePlayPause}>
          {isPaused ? 'Start' : 'Pause'}
        </button>
        <button onClick={onFinish}>End Workout</button>
      </div>
    </div>
  );
}

export default WorkoutRunner;
