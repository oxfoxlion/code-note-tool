import { describe, expect, it } from "vitest";

import { findFirstLesson } from "@/hooks/use-notebook-workspace";
import {
  reorderChaptersInTree,
  reorderLessonsInTree,
  toReorderItems,
} from "@/lib/code-notebook/reorder";
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

  it("skips an excluded lesson when selecting the first available lesson", () => {
    const skippedLesson = {
      id: "lesson-1",
      notebookId: "notebook-1",
      chapterId: "chapter-1",
      title: "Skipped lesson",
      orderIndex: 0,
      codeLanguage: "javascript",
      runtime: "browser",
      autoRun: false,
      maxRuntimeMs: 10000,
    };
    const nextLesson = {
      id: "lesson-2",
      notebookId: "notebook-1",
      chapterId: "chapter-1",
      title: "Next lesson",
      orderIndex: 1,
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
          title: "Has lessons",
          orderIndex: 0,
          isCollapsed: false,
          lessons: [skippedLesson, nextLesson],
        },
      ],
    };

    expect(findFirstLesson(tree, "lesson-1")).toEqual(nextLesson);
  });
});

describe("notebook tree reorder helpers", () => {
  it("reorders chapters and regenerates order indexes", () => {
    const tree: NotebookTree = {
      ...baseTree,
      chapters: [
        {
          id: "chapter-1",
          notebookId: "notebook-1",
          parentId: null,
          title: "One",
          orderIndex: 0,
          isCollapsed: false,
          lessons: [],
        },
        {
          id: "chapter-2",
          notebookId: "notebook-1",
          parentId: null,
          title: "Two",
          orderIndex: 1,
          isCollapsed: false,
          lessons: [],
        },
        {
          id: "chapter-3",
          notebookId: "notebook-1",
          parentId: null,
          title: "Three",
          orderIndex: 2,
          isCollapsed: false,
          lessons: [],
        },
      ],
    };

    const reorderedTree = reorderChaptersInTree(tree, "chapter-3", "chapter-1");

    expect(reorderedTree.chapters.map((chapter) => chapter.id)).toEqual([
      "chapter-3",
      "chapter-1",
      "chapter-2",
    ]);
    expect(toReorderItems(reorderedTree.chapters)).toEqual([
      { id: "chapter-3", orderIndex: 0 },
      { id: "chapter-1", orderIndex: 1 },
      { id: "chapter-2", orderIndex: 2 },
    ]);
  });

  it("reorders lessons within one chapter only", () => {
    const firstLesson = {
      id: "lesson-1",
      notebookId: "notebook-1",
      chapterId: "chapter-1",
      title: "One",
      orderIndex: 0,
      codeLanguage: "javascript",
      runtime: "browser",
      autoRun: false,
      maxRuntimeMs: 10000,
    };
    const secondLesson = {
      ...firstLesson,
      id: "lesson-2",
      title: "Two",
      orderIndex: 1,
    };

    const tree: NotebookTree = {
      ...baseTree,
      chapters: [
        {
          id: "chapter-1",
          notebookId: "notebook-1",
          parentId: null,
          title: "Chapter",
          orderIndex: 0,
          isCollapsed: false,
          lessons: [firstLesson, secondLesson],
        },
      ],
    };

    const reorderedTree = reorderLessonsInTree(
      tree,
      "chapter-1",
      "lesson-2",
      "lesson-1",
    );

    expect(reorderedTree.chapters[0]?.lessons?.map((lesson) => lesson.id)).toEqual([
      "lesson-2",
      "lesson-1",
    ]);
    expect(toReorderItems(reorderedTree.chapters[0]?.lessons ?? [])).toEqual([
      { id: "lesson-2", orderIndex: 0 },
      { id: "lesson-1", orderIndex: 1 },
    ]);
  });
});
