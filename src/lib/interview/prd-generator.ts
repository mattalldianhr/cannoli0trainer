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
      return `${val}/10 (${labels.min} → ${labels.max})`;
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
    roles: get('coaching-identity'),
    athleteCount: get('athlete-count'),
    inPersonVsRemote: get('in-person-vs-remote'),
    facility: get('facility-situation'),
    soloOrTeam: get('coaching-solo-or-team'),
  };

  if (answers['coaching-identity-other']) {
    trainerProfile.rolesOther = get('coaching-identity-other');
  }

  const prdSections: PRDSection[] = [];

  // Executive Summary
  prdSections.push({
    title: 'Executive Summary',
    content: `This PRD captures the requirements of an independent powerlifting and S&C coach currently training ${trainerProfile.athleteCount} athletes (${trainerProfile.inPersonVsRemote}). The trainer operates as ${trainerProfile.soloOrTeam === 'Solo — it\'s just me' ? 'a solo coach' : trainerProfile.soloOrTeam.toLowerCase()} out of ${trainerProfile.facility.toLowerCase()}. Coaching roles include: ${trainerProfile.roles}. The interview identified key workflow pain points, methodology requirements (including VBT and RPE-based programming), competition prep needs, desired platform capabilities, and business growth goals.`,
  });

  // Coach Profile & Practice
  const youQs = questions.filter((q) => q.sectionId === 'you');
  prdSections.push({
    title: 'Coach Profile & Practice Model',
    content: buildSectionContent(youQs, answers),
  });

  // Current Workflow
  const dayQs = questions.filter((q) => q.sectionId === 'day-in-life');
  prdSections.push({
    title: 'Current Workflow & Tools',
    content: buildSectionContent(dayQs, answers),
  });

  // Athlete Profile
  const athleteQs = questions.filter((q) => q.sectionId === 'athletes');
  prdSections.push({
    title: 'Athlete Profile & Interaction Model',
    content: buildSectionContent(athleteQs, answers),
  });

  // Programming & Methodology
  const progQs = questions.filter((q) => q.sectionId === 'programming');
  prdSections.push({
    title: 'Programming & Methodology Requirements',
    content: buildSectionContent(progQs, answers),
  });

  // Competition Prep
  const compQs = questions.filter((q) => q.sectionId === 'comp-prep');
  const compContent = buildSectionContent(compQs, answers);
  if (compContent) {
    prdSections.push({
      title: 'Competition & Meet Prep Requirements',
      content: compContent,
    });
  }

  // Pain Points & Gaps
  const painQs = questions.filter((q) => q.sectionId === 'pain');
  prdSections.push({
    title: 'Current Pain Points & Gaps',
    content: buildSectionContent(painQs, answers),
  });

  // Platform Requirements
  prdSections.push({
    title: 'Must-Have Platform Capabilities',
    content: buildSectionContent(
      questions.filter((q) => q.id === 'must-haves'),
      answers
    ),
  });

  const niceContent = buildSectionContent(
    questions.filter((q) => q.id === 'nice-to-haves'),
    answers
  );
  if (niceContent) {
    prdSections.push({
      title: 'Nice-to-Have Capabilities',
      content: niceContent,
    });
  }

  // Mobile & UX
  const mobileImportance = answers['mobile-importance'];
  if (mobileImportance) {
    prdSections.push({
      title: 'Mobile & Athlete UX Requirements',
      content: `**Mobile importance:** ${get('mobile-importance')}\n\n${answers['dealbreakers'] ? `**Dealbreakers:** ${String(answers['dealbreakers'].value)}` : ''}`,
    });
  }

  // Business & Growth
  const bizQs = questions.filter((q) => q.sectionId === 'business');
  prdSections.push({
    title: 'Business Model & Growth Goals',
    content: buildSectionContent(bizQs, answers),
  });

  // Priorities
  const priorityQs = questions.filter((q) => q.sectionId === 'priorities');
  prdSections.push({
    title: 'Priorities & Timeline',
    content: buildSectionContent(priorityQs, answers),
  });

  return {
    generatedAt: new Date().toISOString(),
    trainerProfile,
    sections: prdSections,
    rawAnswers: answers,
  };
}
