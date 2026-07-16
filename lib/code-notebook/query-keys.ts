import type { UUID } from "./types";

export const codeNotebookQueryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  notebooks: {
    all: ["notebooks"] as const,
    tree: (notebookId: UUID) => ["notebook-tree", notebookId] as const,
  },
  lessons: {
    detail: (lessonId: UUID) => ["lesson", lessonId] as const,
  },
};
