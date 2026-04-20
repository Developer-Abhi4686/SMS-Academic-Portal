export type UserRole = 'teacher' | 'student' | null;

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  userClass: string | null;
  section: string | null;
  createdAt: string;
}

export interface Memory {
  id?: string;
  userId: string;
  type: 'quiz' | 'lesson-plan' | 'test-paper' | 'sample-paper' | 'doubt' | 'assignment';
  title: string;
  content: string;
  createdAt: string;
}

export interface ResourceLink {
  name: string;
  url: string;
  isComingSoon?: boolean;
}

export interface TeacherState {
  lessonPlan: string;
  quiz: string;
  resourceOutput: string;
}

export interface StudentState {
  doubtResponse: string;
  assignmentResponse: string;
  analysisResponse: string;
}

export interface AIResponse {
  text: string;
  type: 'quiz' | 'plan' | 'doubt' | 'assignment' | 'analysis' | 'concept';
}
