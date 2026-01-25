
import { MathLevelConfig, TeluguStage, SystemConfig } from './types';

export const MATH_LEVELS: MathLevelConfig[] = [
  { id: 'novice', name: 'Novice', questionsCount: 15, subQuestions: 1, passRequirement: 93 },
  { id: 'awareness', name: 'Awareness', questionsCount: 30, subQuestions: 1, passRequirement: 90, unlockRequirement: 'novice' },
  { id: 'beginner', name: 'Beginner', questionsCount: 45, subQuestions: 1, passRequirement: 91, unlockRequirement: 'awareness' },
  { id: 'competent', name: 'Competent', questionsCount: 20, subQuestions: 3, passRequirement: 90, unlockRequirement: 'beginner' },
  { id: 'development', name: 'Development', questionsCount: 30, subQuestions: 3, passRequirement: 90, unlockRequirement: 'competent' },
  { id: 'expert', name: 'Expert', questionsCount: 40, subQuestions: 3, passRequirement: 90, unlockRequirement: 'development' },
];

export const TELUGU_STAGES: TeluguStage[] = [
  { id: 'stage-1', category: 'Foundation', name: 'Stage 1' },
  { id: 'stage-2', category: 'Foundation', name: 'Stage 2' },
  { id: 'stage-3', category: 'Foundation', name: 'Stage 3' },
  { id: 'stage-4', category: 'Progressive', name: 'Stage 4' },
  { id: 'stage-5', category: 'Progressive', name: 'Stage 5' },
  { id: 'stage-6', category: 'Progressive', name: 'Stage 6' },
  { id: 'stage-7', category: 'Advanced', name: 'Stage 7' },
  { id: 'stage-8', category: 'Advanced', name: 'Stage 8' },
  { id: 'stage-9', category: 'Advanced', name: 'Stage 9' },
  { id: 'stage-10', category: 'Achiever', name: 'Stage 10' },
  { id: 'stage-11', category: 'Achiever', name: 'Stage 11' },
  { id: 'stage-12', category: 'Achiever', name: 'Stage 12' },
  { id: 'stage-13', category: 'Expert', name: 'Stage 13' },
  { id: 'stage-14', category: 'Expert', name: 'Stage 14' },
  { id: 'stage-15', category: 'Expert', name: 'Stage 15' },
  { id: 'stage-16', category: 'Mastery', name: 'Stage 16' },
  { id: 'stage-17', category: 'Mastery', name: 'Stage 17' },
  { id: 'stage-18', category: 'Mastery', name: 'Stage 18' },
];

export const DEFAULT_BRANDING: SystemConfig = {
  logoUrl: 'https://lh3.googleusercontent.com/d/1wlXkesZA-6CPevQRDL4JH1fz8aE5UzKf',
  customTitle: 'Curious Minds',
  welcomeMessage: 'Welcome to your daily learning companion',
  primaryColor: '#4F46E5',
  secondaryColor: '#1e1b4b',
  accentColor: '#10B981',
  googleSheetsUrl: 'https://script.google.com/macros/s/AKfycbwV6MJV5YcXJMKy0ZgoB4qrZ1Rz50V24CIvPeZye186gn-bmS9EMWkkvfDgalI94_sr0g/exec',
  mathLimits: {
    novice: 50,
    awareness: 50,
    beginner: 50,
    competent: 50,
    development: 50,
    expert: 50
  },
  teluguLimits: {
    'stage-1': 50, 'stage-2': 50, 'stage-3': 50,
    'stage-4': 50, 'stage-5': 50, 'stage-6': 50,
    'stage-7': 50, 'stage-8': 50, 'stage-9': 50, 'stage-10': 50,
    'stage-11': 50, 'stage-12': 50, 'stage-13': 50, 'stage-14': 50,
    'stage-15': 50, 'stage-16': 50, 'stage-17': 50, 'stage-18': 50
  },
  enabledTeluguStages: TELUGU_STAGES.map(s => s.id),
  // Mental Mathematics: Classroom setting with students and "MATH IS FUN!" projection
  mathImageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1200',
  // Telugu Dictation: Stack of books with an apple
  teluguImageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200',
  // Prompt Engineering: High-quality AI/Tech themed workspace
  promptImageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1200'
};
