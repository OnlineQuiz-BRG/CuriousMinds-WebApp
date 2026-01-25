
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  PARENT = 'parent',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  email?: string;
  password?: string; // For Admin-provisioned fallback login
  phone?: string;
  grade?: string;
  curriculum?: string;
  active: boolean;
  allowedModules?: string[]; // IDs of modules allowed (math, telugu, prompt)
  institute?: string; // School or Coaching Center Name
  school?: string; // Specific School Branch
  assignedTeacherId?: string; // ID of the teacher managing this student
  teacherNotes?: string; // Guidance from the teacher
  avatarUrl?: string; // URL to profile picture
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  fileType: 'pdf' | 'video' | 'doc' | 'image' | 'zip' | 'link';
  url: string;
  category: string;
  timestamp: string;
  size?: string;
}

export interface MathLevelConfig {
  id: string;
  name: string;
  questionsCount: number;
  subQuestions: number;
  passRequirement: number; // percentage
  unlockRequirement?: string; // id of required level
}

export interface TestResult {
  id: string;
  userId: string;
  level: string; // Used for Stage ID (e.g., 'stage-1')
  testId: string; // Used for Set #
  duration: number; // For Math (minutes)
  speedGap?: string; // For Telugu (e.g., '10s', '8s')
  correctAnswers: number;
  totalQuestions: number;
  scorePercentage: number;
  timestamp: string;
  timeTakenSeconds: number;
  completed: boolean;
  questionsJson: string;
  wordScores?: number[]; // Array of 0/1 for word-by-word pass/fail (up to 40 items)
}

export interface Question {
  id: string;
  level: string;
  testId: string;
  questionNum: number;
  subQuestion: string; // '', 'a', 'b', 'c'
  text: string;
  answer: string;
  definition?: string;
  context?: string;
}

export interface SystemConfig {
  logoUrl: string;
  customTitle: string;
  welcomeMessage: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  googleSheetsUrl?: string; // URL of the deployed Code.gs Web App
  mathLimits: Record<string, number>;
  teluguLimits: Record<string, number>;
  mathImageUrl: string;
  teluguImageUrl: string;
  promptImageUrl: string;
  enabledTeluguStages?: string[]; // List of IDs for stages enabled for student access
}

export interface TeluguStage {
  id: string;
  category: 'Foundation' | 'Progressive' | 'Advanced' | 'Achiever' | 'Expert' | 'Mastery';
  name: string;
}
