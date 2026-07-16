"use client";

import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";

const markdownEditorTheme = EditorView.theme({
  "&": {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    height: "100%",
  },
  ".cm-activeLine": {
    backgroundColor: "var(--muted)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "var(--muted)",
  },
  ".cm-content": {
    caretColor: "var(--foreground)",
    fontFamily: "var(--font-system-mono)",
    padding: "1rem",
  },
  ".cm-focused": {
    outline: "none",
  },
  ".cm-gutters": {
    backgroundColor: "var(--background)",
    borderRightColor: "var(--border)",
    color: "var(--muted-foreground)",
  },
  ".cm-line": {
    padding: "0 0.25rem",
  },
  ".cm-scroller": {
    backgroundColor: "var(--background)",
    fontFamily: "var(--font-system-mono)",
  },
  ".cm-selectionBackground": {
    backgroundColor: "var(--accent)",
  },
});

export function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        highlightSelectionMatches: true,
      }}
      extensions={[markdown(), markdownEditorTheme]}
      onChange={onChange}
      className="h-full overflow-hidden bg-background text-sm"
    />
  );
}
