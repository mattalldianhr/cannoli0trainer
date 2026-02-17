import type { Question, Answer, ConditionalRule } from './types';

function evaluateCondition(
  rule: ConditionalRule,
  answers: Record<string, Answer>
): boolean {
  const answer = answers[rule.questionId];

  switch (rule.operator) {
    case 'exists':
      return answer !== undefined && answer.value !== '' && answer.value !== null;

    case 'equals':
      if (!answer) return false;
      return String(answer.value) === String(rule.value);

    case 'not-equals':
      if (!answer) return true;
      return String(answer.value) !== String(rule.value);

    case 'includes': {
      if (!answer) return false;
      const acceptedValues = Array.isArray(rule.value) ? rule.value : [rule.value];
      const answerValue = answer.value;
      if (Array.isArray(answerValue)) {
        return acceptedValues.some((v) => answerValue.includes(v));
      }
      return acceptedValues.includes(String(answerValue));
    }

    default:
      return true;
  }
}

export function getVisibleQuestions(
  allQuestions: Question[],
  answers: Record<string, Answer>
): Question[] {
  return allQuestions.filter((question) => {
    if (!question.condition) return true;
    return evaluateCondition(question.condition, answers);
  });
}
