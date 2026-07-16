import type { Chapter, LessonSummary, NotebookTree, ReorderItem, UUID } from "./types";

export function toReorderItems(items: Array<{ id: UUID }>): ReorderItem[] {
  return items.map((item, orderIndex) => ({
    id: item.id,
    orderIndex,
  }));
}

export function reorderById<TItem extends { id: UUID }>(
  items: TItem[],
  activeId: UUID,
  overId: UUID,
) {
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const overIndex = items.findIndex((item) => item.id === overId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return items;
  }

  const nextItems = [...items];
  const [activeItem] = nextItems.splice(activeIndex, 1);
  nextItems.splice(overIndex, 0, activeItem);

  return nextItems;
}

function applyOrderIndex<TItem extends { orderIndex: number }>(items: TItem[]) {
  return items.map((item, orderIndex) => ({
    ...item,
    orderIndex,
  }));
}

export function reorderChaptersInTree(
  tree: NotebookTree,
  activeId: UUID,
  overId: UUID,
): NotebookTree {
  const reorderedChapters = reorderById(tree.chapters, activeId, overId);

  if (reorderedChapters === tree.chapters) {
    return tree;
  }

  return {
    ...tree,
    chapters: applyOrderIndex(reorderedChapters),
  };
}

export function reorderLessonsInTree(
  tree: NotebookTree,
  chapterId: UUID,
  activeId: UUID,
  overId: UUID,
): NotebookTree {
  let didReorder = false;
  const chapters = tree.chapters.map((chapter): Chapter => {
    if (chapter.id !== chapterId) {
      return chapter;
    }

    const lessons = chapter.lessons ?? [];
    const reorderedLessons = reorderById(lessons, activeId, overId);

    if (reorderedLessons === lessons) {
      return chapter;
    }

    didReorder = true;
    return {
      ...chapter,
      lessons: applyOrderIndex(reorderedLessons) as LessonSummary[],
    };
  });

  if (!didReorder) {
    return tree;
  }

  return {
    ...tree,
    chapters,
  };
}
