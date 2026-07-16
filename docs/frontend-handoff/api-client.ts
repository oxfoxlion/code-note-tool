import type {
  AuthenticatedResponse,
  Chapter,
  CreateChapterInput,
  CreateLessonInput,
  CreateNotebookInput,
  Lesson,
  LoginInput,
  LoginResponse,
  Notebook,
  NotebookTree,
  RegisterInput,
  ReorderItem,
  UpdateChapterInput,
  UpdateLessonInput,
  UpdateNotebookInput,
  User,
  UUID,
  VerifyTwoFactorInput,
} from "./types";

// Keep this copy-ready example type-safe even when viewed in the JavaScript-only
// backend repository, which does not install @types/node. Next.js replaces this
// public environment variable in the frontend build.
declare const process: {
  env: {
    NEXT_PUBLIC_API_BASE_URL?: string;
  };
};

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "error" in body
        ? String(body.error)
        : typeof body === "object" && body !== null && "message" in body
          ? String(body.message)
          : `Request failed (${response.status})`;
    throw new ApiError(response.status, message, body);
  }

  return body as T;
}

const json = (value: unknown) => JSON.stringify(value);

export const authApi = {
  register: (input: RegisterInput) =>
    request<AuthenticatedResponse>("/auth/register", {
      method: "POST",
      body: json(input),
    }),

  login: (input: LoginInput) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: json(input),
    }),

  verify2FA: (input: VerifyTwoFactorInput) =>
    request<AuthenticatedResponse>("/auth/2fa/verify", {
      method: "POST",
      body: json(input),
    }),

  me: () => request<{ user: User }>("/auth/me"),
  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),
};

export const codeNotebookApi = {
  listNotebooks: () =>
    request<{ notebooks: Notebook[] }>("/code_notebook/notebooks"),

  createNotebook: (input: CreateNotebookInput) =>
    request<{ notebook: Notebook }>("/code_notebook/notebooks", {
      method: "POST",
      body: json(input),
    }),

  getNotebook: (notebookId: UUID) =>
    request<{ notebook: Notebook }>(`/code_notebook/notebooks/${notebookId}`),

  updateNotebook: (notebookId: UUID, input: UpdateNotebookInput) =>
    request<{ notebook: Notebook }>(`/code_notebook/notebooks/${notebookId}`, {
      method: "PATCH",
      body: json(input),
    }),

  deleteNotebook: (notebookId: UUID) =>
    request<{ ok: true }>(`/code_notebook/notebooks/${notebookId}`, { method: "DELETE" }),

  getNotebookTree: (notebookId: UUID) =>
    request<NotebookTree>(`/code_notebook/notebooks/${notebookId}/tree`),

  createChapter: (input: CreateChapterInput) =>
    request<{ chapter: Chapter }>("/code_notebook/chapters", {
      method: "POST",
      body: json(input),
    }),

  updateChapter: (chapterId: UUID, input: UpdateChapterInput) =>
    request<{ chapter: Chapter }>(`/code_notebook/chapters/${chapterId}`, {
      method: "PATCH",
      body: json(input),
    }),

  deleteChapter: (chapterId: UUID) =>
    request<{ ok: true }>(`/code_notebook/chapters/${chapterId}`, { method: "DELETE" }),

  reorderChapters: (notebookId: UUID, chapters: ReorderItem[]) =>
    request<NotebookTree>(`/code_notebook/notebooks/${notebookId}/chapters/reorder`, {
      method: "PUT",
      body: json({ chapters }),
    }),

  createLesson: (input: CreateLessonInput) =>
    request<{ lesson: Lesson }>("/code_notebook/lessons", {
      method: "POST",
      body: json(input),
    }),

  getLesson: (lessonId: UUID) =>
    request<{ lesson: Lesson }>(`/code_notebook/lessons/${lessonId}`),

  updateLesson: (lessonId: UUID, input: UpdateLessonInput) =>
    request<{ lesson: Lesson }>(`/code_notebook/lessons/${lessonId}`, {
      method: "PATCH",
      body: json(input),
    }),

  updateLessonOutput: (lessonId: UUID, outputContent: string) =>
    request<{ lesson: Lesson }>(`/code_notebook/lessons/${lessonId}/output`, {
      method: "PATCH",
      body: json({ outputContent }),
    }),

  deleteLesson: (lessonId: UUID) =>
    request<{ ok: true }>(`/code_notebook/lessons/${lessonId}`, { method: "DELETE" }),

  reorderLessons: (chapterId: UUID, lessons: ReorderItem[]) =>
    request<NotebookTree>(`/code_notebook/chapters/${chapterId}/lessons/reorder`, {
      method: "PUT",
      body: json({ lessons }),
    }),

  renderMarkdown: (markdown: string) =>
    request<{ html: string }>("/code_notebook/markdown/render", {
      method: "POST",
      body: json({ markdown }),
    }),
};
