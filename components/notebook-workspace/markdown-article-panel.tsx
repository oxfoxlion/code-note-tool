"use client";

import dynamic from "next/dynamic";
import { Eye, FileText, Loader2, Pencil, RefreshCw, RotateCcw, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, codeNotebookApi } from "@/lib/code-notebook/api-client";
import type { Lesson } from "@/lib/code-notebook/types";
import { cn } from "@/lib/utils";

const MarkdownEditor = dynamic(
  () => import("./markdown-editor").then((mod) => mod.MarkdownEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        正在載入編輯器
      </div>
    ),
  },
);

type ArticleMode = "edit" | "preview";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function PanelHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 border-b px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium">{title}</h2>
          {description ? (
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full min-h-48 items-center justify-center px-6 text-center">
      <div className="max-w-sm space-y-3">
        <TriangleAlert className="mx-auto size-8 text-destructive" />
        <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" />
          重試
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-48 items-center justify-center px-6 text-center">
      <div className="max-w-sm space-y-3">
        <div className="mx-auto flex size-10 items-center justify-center rounded-md border bg-muted">
          <FileText className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">尚未選擇 lesson</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            從左側章節樹選擇 lesson 後會顯示文章內容。
          </p>
        </div>
      </div>
    </div>
  );
}

function PreviewContent({
  html,
  markdown,
  isRendering,
  renderError,
  isPreviewStale,
  onRefreshPreview,
}: {
  html: string;
  markdown: string;
  isRendering: boolean;
  renderError: string | null;
  isPreviewStale: boolean;
  onRefreshPreview: () => void;
}) {
  const hasMarkdown = markdown.trim().length > 0;

  return (
    <ScrollArea className="h-full">
      <article className="p-4">
        {isPreviewStale ? (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-md border bg-muted p-3 text-sm">
            <span className="min-w-0 text-muted-foreground">
              Markdown 已修改，預覽尚未更新。
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onRefreshPreview}
              disabled={isRendering}
            >
              {isRendering ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              更新
            </Button>
          </div>
        ) : null}
        {renderError ? (
          <div
            className="mb-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>{renderError}</span>
          </div>
        ) : null}
        {isRendering ? (
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            正在更新預覽
          </div>
        ) : null}
        {html ? (
          <div
            className={cn(
              "max-w-none text-sm leading-7",
              "[&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
              "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
              "[&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold",
              "[&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal [&_p]:mb-3",
              "[&_pre]:mb-3 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-foreground",
              "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : hasMarkdown ? (
          <p className="text-sm text-muted-foreground">
            Markdown 已輸入，但後端回傳空白預覽。
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">這個 lesson 還沒有 Markdown 內容。</p>
        )}
      </article>
    </ScrollArea>
  );
}

export function MarkdownArticlePanel({
  lesson,
  isLoading,
  error,
  onRetry,
}: {
  lesson: Lesson | null;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <section className="flex h-full min-h-0 flex-col">
        <PanelHeader title="Article" description="Markdown" />
        <div className="min-h-0 flex-1">
          <LoadingPanel label="正在載入 lesson" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex h-full min-h-0 flex-col">
        <PanelHeader title="Article" description="Markdown" />
        <div className="min-h-0 flex-1">
          <ErrorPanel
            message={getErrorMessage(error, "Lesson 載入失敗")}
            onRetry={onRetry}
          />
        </div>
      </section>
    );
  }

  if (!lesson) {
    return (
      <section className="flex h-full min-h-0 flex-col">
        <PanelHeader title="Article" description="Markdown" />
        <div className="min-h-0 flex-1">
          <EmptyState />
        </div>
      </section>
    );
  }

  return <MarkdownArticleEditor key={lesson.id} lesson={lesson} />;
}

function MarkdownArticleEditor({ lesson }: { lesson: Lesson }) {
  const [mode, setMode] = useState<ArticleMode>("preview");
  const [markdownContent, setMarkdownContent] = useState(lesson.markdownContent);
  const [previewHtml, setPreviewHtml] = useState(lesson.htmlContent);
  const [previewMarkdown, setPreviewMarkdown] = useState(lesson.markdownContent);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const isDirty = markdownContent !== lesson.markdownContent;
  const isPreviewStale = markdownContent !== previewMarkdown;
  const description = useMemo(
    () => (isDirty ? `${lesson.title} / 未儲存草稿` : lesson.title),
    [isDirty, lesson.title],
  );

  const refreshPreview = async () => {
    const markdownToRender = markdownContent;

    setIsRendering(true);
    setRenderError(null);
    setMode("preview");

    try {
      const result = await codeNotebookApi.renderMarkdown(markdownToRender);
      setPreviewHtml(result.html);
      setPreviewMarkdown(markdownToRender);
    } catch (renderPreviewError) {
      setRenderError(getErrorMessage(renderPreviewError, "Markdown 預覽更新失敗"));
    } finally {
      setIsRendering(false);
    }
  };

  const selectMode = (value: string) => {
    const nextMode = value as ArticleMode;
    setMode(nextMode);

    if (nextMode === "preview" && isPreviewStale && !isRendering) {
      void refreshPreview();
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col">
      <PanelHeader title="Article" description={description}>
        <div className="flex shrink-0 items-center gap-2">
          <Tabs
            value={mode}
            onValueChange={selectMode}
            className="min-w-0"
          >
            <TabsList className="h-8">
              <TabsTrigger value="edit" className="h-7 px-2">
                <Pencil className="size-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="h-7 px-2">
                <Eye className="size-4" />
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={refreshPreview}
            disabled={isRendering}
          >
            {isRendering ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            預覽
          </Button>
        </div>
      </PanelHeader>
      <div className="min-h-0 flex-1">
        {mode === "edit" ? (
          <MarkdownEditor value={markdownContent} onChange={setMarkdownContent} />
        ) : (
          <PreviewContent
            html={previewHtml}
            markdown={markdownContent}
            isRendering={isRendering}
            renderError={renderError}
            isPreviewStale={isPreviewStale}
            onRefreshPreview={refreshPreview}
          />
        )}
      </div>
      <Separator />
      <div className="flex h-8 shrink-0 items-center justify-between gap-3 px-3 text-xs text-muted-foreground">
        <span className="truncate">
          {isDirty ? "目前變更只在本機草稿，儲存會在 autosave 階段接上。" : "Preview 使用後端渲染 HTML。"}
        </span>
        <span className="shrink-0">{markdownContent.length} chars</span>
      </div>
    </section>
  );
}
