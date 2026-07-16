import { describe, expect, it } from "vitest";

import { findFirstLesson } from "@/hooks/use-notebook-workspace";
import type { NotebookTree } from "@/lib/code-notebook/types";

const baseTree: NotebookTree = {
  notebook: {
    id: "notebook-1",
    title: "Notebook",
    description: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  chapters: [],
};

describe("findFirstLesson", () => {
  it("returns the first available lesson in chapter order", () => {
    const lesson = {
      id: "lesson-1",
      notebookId: "notebook-1",
      chapterId: "chapter-2",
      title: "First lesson",
      orderIndex: 0,
      codeLanguage: "javascript",
      runtime: "browser",
      autoRun: false,
      maxRuntimeMs: 10000,
    };

    const tree: NotebookTree = {
      ...baseTree,
      chapters: [
        {
          id: "chapter-1",
          notebookId: "notebook-1",
          parentId: null,
          title: "Empty",
          orderIndex: 0,
          isCollapsed: false,
          lessons: [],
        },
        {
          id: "chapter-2",
          notebookId: "notebook-1",
          parentId: null,
          title: "Has lessons",
          orderIndex: 1,
          isCollapsed: false,
          lessons: [lesson],
        },
      ],
    };

    expect(findFirstLesson(tree)).toEqual(lesson);
  });

  it("returns null when there are no lessons", () => {
    expect(findFirstLesson(baseTree)).toBeNull();
  });
});
