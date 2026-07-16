"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ApiError, codeNotebookApi } from "@/lib/code-notebook/api-client";
import { codeNotebookQueryKeys } from "@/lib/code-notebook/query-keys";
import type { LessonSummary, NotebookTree, UUID } from "@/lib/code-notebook/types";

export function findFirstLesson(
  tree: NotebookTree | undefined,
  excludedLessonId: UUID | null = null,
) {
  if (!tree) {
    return null;
  }

  for (const chapter of tree.chapters) {
    const lesson = chapter.lessons?.find((item) => item.id !== excludedLessonId);
    if (lesson) {
      return lesson;
    }
  }

  return null;
}

export function useNotebookWorkspace() {
  const [requestedNotebookId, setRequestedNotebookId] = useState<UUID | null>(null);
  const [requestedLessonId, setRequestedLessonId] = useState<UUID | null>(null);
  const [invalidLessonId, setInvalidLessonId] = useState<UUID | null>(null);

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

  const firstLesson = findFirstLesson(treeQuery.data, invalidLessonId);
  const requestedLessonExists = treeQuery.data?.chapters.some((chapter) =>
    chapter.lessons?.some(
      (lesson) => lesson.id === requestedLessonId && lesson.id !== invalidLessonId,
    ),
  );
  const selectedLessonId = requestedLessonExists ? requestedLessonId : firstLesson?.id ?? null;

  const lessonQuery = useQuery({
    queryKey: selectedLessonId
      ? codeNotebookQueryKeys.lessons.detail(selectedLessonId)
      : ["lesson", "idle"],
    queryFn: async () => {
      try {
        return await codeNotebookApi.getLesson(selectedLessonId as UUID);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404 && selectedLessonId) {
          setInvalidLessonId(selectedLessonId);
          setRequestedLessonId(null);
          void treeQuery.refetch();
        }

        throw error;
      }
    },
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
    setSelectedLessonId: (lessonId: UUID | null) => {
      setInvalidLessonId(null);
      setRequestedLessonId(lessonId);
    },
    setSelectedNotebookId: (notebookId: UUID | null) => {
      setInvalidLessonId(null);
      setRequestedNotebookId(notebookId);
    },
    tree: treeQuery.data ?? null,
    treeQuery,
    lesson: lessonQuery.data?.lesson ?? null,
    lessonQuery,
  };
}
