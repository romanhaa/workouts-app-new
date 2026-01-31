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

    const allSteps = workout.steps.flatMap(s => s.type === 'repetition' ? Array(s.count).fill(s.steps).flat() : s);
    const currentStep: WorkoutStep | undefined = allSteps[currentStepIndex];

    const [countdown, setCountdown] = useState(currentStep?.duration ?? 0);

    const triggerFeedback = () => {
        // Always play sound
        if (!audioContextRef.current) {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = context;
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        const context = audioContextRef.current;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, context.currentTime);
        gainNode.gain.setValueAtTime(0.5, context.currentTime);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.15);

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
            triggerFeedback();
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

  const handlePlayPause = () => {
    if (!audioContextRef.current) {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;
    }
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
    if (isPaused) {
        triggerFeedback();
    }
    setIsPaused(!isPaused);
  }

  return (
    <div className="workout-runner">
      <h1>{workout.name}</h1>
      <div className="progress-bar">
        <div style={{ width: `${progress}%` }} />
      </div>

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
