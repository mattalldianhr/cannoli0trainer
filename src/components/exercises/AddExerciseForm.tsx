'use client';

import { ExerciseForm } from './ExerciseForm';

interface AddExerciseFormProps {
  coachId: string;
}

export function AddExerciseForm({ coachId }: AddExerciseFormProps) {
  return <ExerciseForm coachId={coachId} />;
}
