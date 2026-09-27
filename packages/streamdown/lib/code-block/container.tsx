import type { ComponentProps } from "react";
import { useCn } from "../prefix-context";

type CodeBlockContainerProps = ComponentProps<"div"> & {
  language: string;
  /** Whether the code block is still being streamed (incomplete) */
  isIncomplete?: boolean;
};

export const CodeBlockContainer = ({
  className,
  language,
  style,
  isIncomplete,
  ...props
}: CodeBlockContainerProps) => {
  const cn = useCn();
  return (
    <div
      className={cn(
        "relative my-4 flex w-full flex-col gap-2 rounded-xl border border-border bg-sidebar p-2",
        className
      )}
      data-incomplete={isIncomplete || undefined}
      data-language={language}
      data-streamdown="code-block"
      // Keep real off-screen geometry: estimated content-visibility heights
      // change the parent scroll range as blocks enter view, jumping its thumb.
      style={style}
      {...props}
    />
  );
};
