'use client';

import { useReducer, useEffect, useMemo, useCallback } from 'react';
import type { Answer, InterviewState, Question } from '@/lib/interview/types';
import { questions, sections } from '@/lib/interview/questions';
import { getVisibleQuestions } from '@/lib/interview/flow-engine';

const STORAGE_KEY = 'sc-interview-state';

type Action =
  | { type: 'SET_ANSWER'; questionId: string; value: Answer['value'] }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREV_QUESTION' }
  | { type: 'GO_TO_QUESTION'; index: number }
  | { type: 'RESET' }
  | { type: 'LOAD'; state: InterviewState };

function reducer(state: InterviewState, action: Action): InterviewState {
  switch (action.type) {
    case 'SET_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: {
            questionId: action.questionId,
            value: action.value,
          },
        },
        lastUpdatedAt: new Date().toISOString(),
      };
    case 'NEXT_QUESTION':
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        lastUpdatedAt: new Date().toISOString(),
      };
    case 'PREV_QUESTION':
      return {
        ...state,
        currentIndex: Math.max(0, state.currentIndex - 1),
        lastUpdatedAt: new Date().toISOString(),
      };
    case 'GO_TO_QUESTION':
      return {
        ...state,
        currentIndex: action.index,
        lastUpdatedAt: new Date().toISOString(),
      };
    case 'RESET':
      return createInitialState();
    case 'LOAD':
      return action.state;
    default:
      return state;
  }
}

function createInitialState(): InterviewState {
  return {
    currentIndex: 0,
    answers: {},
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
}

function loadFromStorage(): InterviewState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InterviewState;
  } catch {
    return null;
  }
}

function saveToStorage(state: InterviewState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable
  }
}

export function useInterview() {
  const [state, dispatch] = useReducer(reducer, null, () => {
    return loadFromStorage() || createInitialState();
  });

  // Hydrate from localStorage on mount (handles SSR mismatch)
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      dispatch({ type: 'LOAD', state: saved });
    }
  }, []);

  // Persist to localStorage on every state change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const visibleQuestions = useMemo(
    () => getVisibleQuestions(questions, state.answers),
    [state.answers]
  );

  // Total visible count + 2 extra steps: review and export
  const totalVisible = visibleQuestions.length;
  const currentIndex = state.currentIndex;

  const currentQuestion: Question | null = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < totalVisible) {
      return visibleQuestions[currentIndex];
    }
    return null;
  }, [currentIndex, totalVisible, visibleQuestions]);

  const section = useMemo(() => {
    if (!currentQuestion) return null;
    return sections.find((s) => s.id === currentQuestion.sectionId) ?? null;
  }, [currentQuestion]);

  const progress = useMemo(() => {
    if (totalVisible === 0) return 0;
    // +2 for review & export steps
    return Math.round((currentIndex / (totalVisible + 2)) * 100);
  }, [currentIndex, totalVisible]);

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalVisible - 1;
  // Phase tracking: questions -> review -> export
  const phase: 'questions' | 'review' | 'export' = currentIndex < totalVisible ? 'questions' : currentIndex === totalVisible ? 'review' : 'export';
  const isComplete = phase === 'export';

  const setAnswer = useCallback(
    (questionId: string, value: Answer['value']) => {
      dispatch({ type: 'SET_ANSWER', questionId, value });
    },
    []
  );

  const next = useCallback(() => {
    dispatch({ type: 'NEXT_QUESTION' });
  }, []);

  const prev = useCallback(() => {
    dispatch({ type: 'PREV_QUESTION' });
  }, []);

  const goTo = useCallback((index: number) => {
    dispatch({ type: 'GO_TO_QUESTION', index });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    answers: state.answers,
    currentQuestion,
    currentIndex,
    totalVisible,
    progress,
    section,
    setAnswer,
    next,
    prev,
    goTo,
    reset,
    isFirst,
    isLast,
    isComplete,
    visibleQuestions,
    phase,
    sections,
    allQuestions: questions,
  };
}
