export type UUID = string;
export type ISODateString = string;

export interface Notebook {
  id: UUID;
  title: string;
  description: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Chapter {
  id: UUID;
  notebookId: UUID;
  parentId: UUID | null;
  title: string;
  orderIndex: number;
  isCollapsed: boolean;
  lessons?: LessonSummary[];
}

export interface LessonSummary {
  id: UUID;
  notebookId: UUID;
  chapterId: UUID;
  title: string;
  orderIndex: number;
  codeLanguage: string;
  runtime: string;
  autoRun: boolean;
  maxRuntimeMs: number;
}

export interface Lesson extends LessonSummary {
  markdownContent: string;
  htmlContent: string;
  codeContent: string;
  outputContent: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface NotebookTree {
  notebook: Notebook;
  chapters: Chapter[];
}

export interface CreateNotebookInput {
  title: string;
  description?: string | null;
}

export type UpdateNotebookInput = Partial<CreateNotebookInput>;

export interface CreateChapterInput {
  notebookId: UUID;
  title: string;
  parentId?: UUID | null;
  orderIndex?: number;
  isCollapsed?: boolean;
}

export type UpdateChapterInput = Partial<
  Pick<CreateChapterInput, "title" | "parentId" | "orderIndex" | "isCollapsed">
>;

export interface CreateLessonInput {
  chapterId: UUID;
  title: string;
  orderIndex?: number;
  markdownContent?: string;
  codeLanguage?: string;
  runtime?: string;
  codeContent?: string;
  outputContent?: string;
  autoRun?: boolean;
  maxRuntimeMs?: number;
}

export type UpdateLessonInput = Partial<CreateLessonInput>;

export interface ReorderItem {
  id: UUID;
  orderIndex: number;
}

export interface ApiErrorBody {
  error?: string;
  message?: string;
}

export type RegisterInput =
  | {
      email: string;
      password: string;
      display_name?: string;
      nickname?: never;
      pin?: never;
    }
  | {
      nickname: string;
      pin: string;
      email?: never;
      password?: never;
      display_name?: never;
    };

export type LoginInput =
  | {
      email: string;
      password: string;
      nickname?: never;
      pin?: never;
    }
  | {
      nickname: string;
      pin: string;
      email?: never;
      password?: never;
    };

export interface AuthenticatedResponse {
  message: string;
  user: User;
  require2FA?: false;
  userId?: never;
}

export interface RequireTwoFactorResponse {
  require2FA: true;
  userId: UUID;
  displayName: string;
  message?: never;
  user?: never;
}

export type LoginResponse = AuthenticatedResponse | RequireTwoFactorResponse;

export interface VerifyTwoFactorInput {
  userId: UUID;
  token: string;
}

export interface User {
  id: UUID;
  email: string | null;
  displayName: string | null;
  nickname: string | null;
  twoFactorEnabled: boolean;
  hasPassword: boolean;
  hasPin: boolean;
  googleLinked: boolean;
  discordLinked: boolean;
  createdAt: ISODateString;
  lastLoginAt: ISODateString | null;
}
