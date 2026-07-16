"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { codeNotebookApi } from "@/lib/code-notebook/api-client";
import { codeNotebookQueryKeys } from "@/lib/code-notebook/query-keys";
import type { LessonSummary, NotebookTree, UUID } from "@/lib/code-notebook/types";

export function findFirstLesson(tree: NotebookTree | undefined) {
  if (!tree) {
    return null;
  }

  for (const chapter of tree.chapters) {
    const lesson = chapter.lessons?.[0];
    if (lesson) {
      return lesson;
    }
  }

  return null;
}

export function useNotebookWorkspace() {
  const [requestedNotebookId, setSelectedNotebookId] = useState<UUID | null>(null);
  const [requestedLessonId, setSelectedLessonId] = useState<UUID | null>(null);

  const notebooksQuery = useQuery({
    queryKey: codeNotebookQueryKeys.notebooks.all,
    queryFn: codeNotebookApi.listNotebooks,
  });

  const notebooks = useMemo(
    () => notebooksQuery.data?.notebooks ?? [],
    [notebooksQuery.data?.notebooks],
  );

  const requestedNotebookExists = notebooks.some(
    (notebook) => notebook.id === requestedNotebookId,
  );
  const selectedNotebookId = requestedNotebookExists
    ? requestedNotebookId
    : notebooks[0]?.id ?? null;

  const treeQuery = useQuery({
    queryKey: selectedNotebookId
      ? codeNotebookQueryKeys.notebooks.tree(selectedNotebookId)
      : ["notebook-tree", "idle"],
    queryFn: () => codeNotebookApi.getNotebookTree(selectedNotebookId as UUID),
    enabled: selectedNotebookId !== null,
  });

  const firstLesson = findFirstLesson(treeQuery.data);
  const requestedLessonExists = treeQuery.data?.chapters.some((chapter) =>
    chapter.lessons?.some((lesson) => lesson.id === requestedLessonId),
  );
  const selectedLessonId = requestedLessonExists ? requestedLessonId : firstLesson?.id ?? null;

  const lessonQuery = useQuery({
    queryKey: selectedLessonId
      ? codeNotebookQueryKeys.lessons.detail(selectedLessonId)
      : ["lesson", "idle"],
    queryFn: () => codeNotebookApi.getLesson(selectedLessonId as UUID),
    enabled: selectedLessonId !== null,
  });

  const selectedLessonSummary = useMemo<LessonSummary | null>(() => {
    if (!treeQuery.data || !selectedLessonId) {
      return null;
    }

    for (const chapter of treeQuery.data.chapters) {
      const lesson = chapter.lessons?.find((item) => item.id === selectedLessonId);
      if (lesson) {
        return lesson;
      }
    }

    return null;
  }, [selectedLessonId, treeQuery.data]);

  return {
    notebooks,
    notebooksQuery,
    selectedNotebookId,
    selectedLessonId,
    selectedLessonSummary,
    setSelectedLessonId,
    setSelectedNotebookId,
    tree: treeQuery.data ?? null,
    treeQuery,
    lesson: lessonQuery.data?.lesson ?? null,
    lessonQuery,
  };
}
