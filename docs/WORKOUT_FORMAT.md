# Workout Data Format

This document describes the structure of the `workouts.json` file, which defines the workouts available in the application. Understanding this format will allow you to easily create and modify workout routines.

The workout data is a JSON array of `Workout` objects.

## Core Data Structures

### 1. `Workout` Object

A `Workout` object represents a complete workout routine.

| Property       | Type                               | Description                                                                  |
| :------------- | :--------------------------------- | :--------------------------------------------------------------------------- |
| `id`           | `string`                           | A unique identifier for the workout.                                         |
| `name`         | `string`                           | The display name of the workout.                                             |
| `muscleGroups` | `string[]` (optional)              | An array of strings, listing the primary muscle groups targeted by the workout. |
| `steps`        | `RunnabaleWorkoutStep[]` (optional) | An array of individual workout steps. Used if the workout does not have sections. |
| `sections`     | `WorkoutSection[]` (optional)      | An array of `WorkoutSection` objects. Used if the workout is divided into sections. |

**Note:** A `Workout` should have either a `steps` array or a `sections` array, but not both.

**Example `Workout`:**

```json
{
  "id": "my-custom-workout",
  "name": "My Custom Full Body Routine",
  "muscleGroups": ["Full Body", "Core"],
  "steps": [
    { "type": "exercise", "name": "Jumping Jacks", "duration": 30 },
    { "type": "rest", "duration": 10 }
  ]
}
```

### 2. `WorkoutSection` Object

A `WorkoutSection` allows you to group related steps within a workout (e.g., "Warm-up", "Main Circuit", "Cool Down").

| Property | Type                    | Description                                       |
| :------- | :---------------------- | :------------------------------------------------ |
| `name`   | `string`                | The display name of the section.                  |
| `steps`  | `RunnabaleWorkoutStep[]` | An array of individual workout steps within this section. |

**Example `Workout` with Sections:**

```json
{
  "id": "sectioned-example",
  "name": "Morning Boost",
  "sections": [
    {
      "name": "Warm-up",
      "steps": [
        { "type": "exercise", "name": "Arm Circles", "duration": 30 }
      ]
    },
    {
      "name": "Main Circuit",
      "steps": [
        { "type": "exercise", "name": "Push-ups", "duration": 45, "description": "Keep back straight." },
        { "type": "rest", "duration": 15 }
      ]
    }
  ]
}
```

### 3. `RunnabaleWorkoutStep` Types

This is a union type that can be one of `ExerciseStep`, `RestStep`, or `RepetitionStep`.

#### `ExerciseStep`

Represents a single exercise.

| Property    | Type     | Description                        |
| :---------- | :------- | :--------------------------------- |
| `type`      | `'exercise'` | Must be `'exercise'`.             |
| `name`      | `string` | The name of the exercise.          |
| `duration`  | `number` | Duration of the exercise in seconds. |
| `description` | `string` (optional) | Optional description or instructions for the exercise. |

**Example `ExerciseStep`:**

```json
{
  "type": "exercise",
  "name": "Squats",
  "duration": 60,
  "description": "Lower until thighs are parallel to the floor."
}
```

#### `RestStep`

Represents a rest period.

| Property   | Type   | Description                     |
| :--------- | :----- | :------------------------------ |
| `type`     | `'rest'` | Must be `'rest'`.               |
| `duration` | `number` | Duration of the rest in seconds. |

**Example `RestStep`:**

```json
{
  "type": "rest",
  "duration": 30
}
```

#### `RepetitionStep`

Represents a block of steps that should be repeated a specified number of times.

| Property        | Type                   | Description                                                |
| :-------------- | :--------------------- | :--------------------------------------------------------- |
| `type`          | `'repetition'`         | Must be `'repetition'`.                                   |
| `count`         | `number`               | The number of times the `steps` array should be repeated. |
| `steps`         | `RunnabaleWorkoutStep[]` | An array of steps (exercises or rests) to be repeated.       |
| `restBetweenReps` | `number` (optional)    | An optional rest duration (in seconds) that occurs between each repetition of the `steps` array. |

**Example `RepetitionStep`:**

```json
{
  "type": "repetition",
  "count": 3,
  "steps": [
    { "type": "exercise", "name": "Push-ups", "duration": 30 },
    { "type": "rest", "duration": 10 }
  ],
  "restBetweenReps": 20
}
```
In this example, the "Push-ups" and "Rest (10s)" sequence will be performed 3 times. There will be a 20-second rest *after the first and second repetitions*. There will be no `restBetweenReps` after the final repetition.

## Creating New Workouts

1.  **Open `public/workouts.json`**.
2.  **Add a new `Workout` object** to the top-level JSON array.
3.  **Define your workout structure:**
    *   Choose between a `steps` array (simple sequence) or a `sections` array (grouped steps).
    *   Populate the `steps` array of your workout or sections with `ExerciseStep`, `RestStep`, or `RepetitionStep` objects.
    *   Ensure each `Workout` object has a unique `id`. If you're creating a test workout that should only appear in development, ensure its `id` starts with `test-` followed by digits (e.g., `test-1`, `test-quick`).
4.  **Save the `workouts.json` file**. The application should automatically pick up your new workout.

Remember to validate your JSON for correct syntax before saving. You can use online JSON validators or your IDE's built-in features.
