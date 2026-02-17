import type { Section, Question, Answer, PRDOutput, PRDSection } from './types';

function getAnswerDisplay(question: Question, answer: Answer): string {
  const val = answer.value;

  if (question.type === 'single-choice' && question.options) {
    const opt = question.options.find((o) => o.value === val);
    return opt ? opt.label : String(val);
  }

  if (question.type === 'multi-choice' && question.options && Array.isArray(val)) {
    return val
      .map((v) => {
        const opt = question.options!.find((o) => o.value === v);
        return opt ? opt.label : v;
      })
      .join(', ');
  }

  if (question.type === 'scale') {
    const labels = question.scaleLabels;
    if (labels) {
      return `${val}/10 (${labels.min} to ${labels.max})`;
    }
    return `${val}/10`;
  }

  if (question.type === 'ranking' && Array.isArray(val)) {
    return val
      .map((v, i) => {
        const opt = question.options?.find((o) => o.value === v);
        return `${i + 1}. ${opt ? opt.label : v}`;
      })
      .join('\n');
  }

  return String(val);
}

function getAnswerForQuestion(
  questionId: string,
  questions: Question[],
  answers: Record<string, Answer>
): string {
  const answer = answers[questionId];
  if (!answer) return 'Not answered';
  const question = questions.find((q) => q.id === questionId);
  if (!question) return String(answer.value);
  return getAnswerDisplay(question, answer);
}

function buildSectionContent(
  sectionQuestions: Question[],
  answers: Record<string, Answer>
): string {
  return sectionQuestions
    .filter((q) => answers[q.id])
    .map((q) => {
      const display = getAnswerDisplay(q, answers[q.id]);
      return `**${q.title}**\n${display}`;
    })
    .join('\n\n');
}

export function generatePRD(
  sections: Section[],
  questions: Question[],
  answers: Record<string, Answer>
): PRDOutput {
  const get = (id: string) => getAnswerForQuestion(id, questions, answers);

  const trainerProfile: Record<string, string> = {
    role: get('role'),
    organization: get('org-type'),
    athleteCount: get('athlete-count'),
  };

  if (answers['role-other']) {
    trainerProfile.roleDetail = get('role-other');
  }
  if (answers['org-type-other']) {
    trainerProfile.orgDetail = get('org-type-other');
  }

  const prdSections: PRDSection[] = [];

  // Executive Summary
  const roleName = trainerProfile.roleDetail || trainerProfile.role;
  const orgName = trainerProfile.orgDetail || trainerProfile.organization;
  prdSections.push({
    title: 'Executive Summary',
    content: `This PRD captures the requirements of a ${roleName} working in a ${orgName} environment, training ${trainerProfile.athleteCount} athletes. The interview identified key pain points, required features, budget constraints, and workflow preferences to inform platform design and prioritization.`,
  });

  // Trainer Profile & Context
  const welcomeQs = questions.filter((q) => q.sectionId === 'welcome');
  prdSections.push({
    title: 'Trainer Profile & Context',
    content: buildSectionContent(welcomeQs, answers),
  });

  // Current Pain Points & Requirements Drivers
  const painQs = questions.filter((q) => q.sectionId === 'pain-points');
  const currentSetupQs = questions.filter((q) => q.sectionId === 'current-setup');
  prdSections.push({
    title: 'Current Pain Points & Requirements Drivers',
    content: [
      buildSectionContent(currentSetupQs, answers),
      buildSectionContent(painQs, answers),
    ]
      .filter(Boolean)
      .join('\n\n---\n\n'),
  });

  // Must-Have Features
  prdSections.push({
    title: 'Must-Have Features',
    content: buildSectionContent(
      questions.filter((q) => q.id === 'must-have-features'),
      answers
    ),
  });

  // Nice-to-Have Features
  prdSections.push({
    title: 'Nice-to-Have Features',
    content: buildSectionContent(
      questions.filter((q) => q.id === 'nice-to-have-features'),
      answers
    ),
  });

  // Technical Requirements
  const techQs = questions.filter((q) => q.sectionId === 'technical');
  prdSections.push({
    title: 'Technical Requirements',
    content: buildSectionContent(techQs, answers),
  });

  // Budget Constraints
  const budgetQs = questions.filter((q) => q.sectionId === 'budget');
  prdSections.push({
    title: 'Budget Constraints',
    content: buildSectionContent(budgetQs, answers),
  });

  // User Interaction Model
  const athleteQs = questions.filter((q) => q.sectionId === 'athlete-model');
  prdSections.push({
    title: 'User Interaction Model',
    content: buildSectionContent(athleteQs, answers),
  });

  // Data & Analytics Requirements
  const dataQs = questions.filter((q) => q.sectionId === 'data-analytics');
  prdSections.push({
    title: 'Data & Analytics Requirements',
    content: buildSectionContent(dataQs, answers),
  });

  // Communication Requirements
  const commQs = questions.filter((q) => q.sectionId === 'communication');
  prdSections.push({
    title: 'Communication Requirements',
    content: buildSectionContent(commQs, answers),
  });

  // Key Workflows
  const workflowQs = questions.filter((q) => q.sectionId === 'workflows');
  prdSections.push({
    title: 'Key Workflows',
    content: buildSectionContent(workflowQs, answers),
  });

  // Implementation Timeline & Priorities
  const priorityQs = questions.filter((q) => q.sectionId === 'priorities');
  prdSections.push({
    title: 'Implementation Timeline & Priorities',
    content: buildSectionContent(priorityQs, answers),
  });

  // Dealbreakers
  if (answers['dealbreakers']) {
    prdSections.push({
      title: 'Dealbreakers',
      content: String(answers['dealbreakers'].value),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    trainerProfile,
    sections: prdSections,
    rawAnswers: answers,
  };
}
