export const QUESTION_TYPE_COUNTS = {
  Leaflet: 6,
  Ordering: 5,
  Context_Filling: 5,
  Reading_8: 8,
  Reading_10: 10
};

export const createEmptyAnswer = () => ({ content: '', isCorrect: false, explanation: '' });
export const createEmptyQuestion = () => ({ question: '', answers: [createEmptyAnswer(), createEmptyAnswer(), createEmptyAnswer(), createEmptyAnswer()], tagIds: [], tagSearch: '' });

export const getDefaultPrompt = (questionType) => {
  const mapping = {
    Leaflet: 'Read the following leaflet/advertisement and mark a one on your answer sheet to indicate the best fit for each numbered blank.',
    Ordering: 'Mark a one on your answer sheet to indicate the best way to arrange sentences or words to form a meaningful dialogue or text for each of the following questions.',
    Context_Filling: 'Read the following passage and mark one on your answer sheet to indicate the best option for each numbered blank.',
    Reading_8: 'Read the following passage and mark one on your answer sheet to indicate the correct answer for each question.',
    Reading_10: 'Read the following passage and mark a one on your answer sheet to indicate the best answer for each of the following questions.'
  };
  return mapping[questionType] || '';
};

export const getRequiredQuestionCount = (type) => QUESTION_TYPE_COUNTS[type] || 0;

export const normalizeQuestionCount = (currentQuestions, targetCount) => {
  const result = [...currentQuestions];
  while (result.length < targetCount) {
    result.push(createEmptyQuestion());
  }
  if (result.length > targetCount) {
    result.length = targetCount;
  }
  return result;
};