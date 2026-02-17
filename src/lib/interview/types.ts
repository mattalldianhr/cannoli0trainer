export type QuestionType = 'single-choice' | 'multi-choice' | 'text' | 'textarea' | 'scale' | 'ranking';

export interface ConditionalRule {
  questionId: string;
  operator: 'equals' | 'includes' | 'not-equals' | 'exists';
  value: string | string[];
}

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  sectionId: string;
  type: QuestionType;
  title: string;
  description?: string;
  options?: QuestionOption[];
  placeholder?: string;
  required?: boolean;
  condition?: ConditionalRule;
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
}

export interface Section {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface Answer {
  questionId: string;
  value: string | string[] | number;
}

export interface InterviewState {
  currentIndex: number;
  answers: Record<string, Answer>;
  startedAt: string;
  lastUpdatedAt: string;
}

export interface PRDSection {
  title: string;
  content: string;
}

export interface PRDOutput {
  generatedAt: string;
  trainerProfile: Record<string, string>;
  sections: PRDSection[];
  rawAnswers: Record<string, Answer>;
}
