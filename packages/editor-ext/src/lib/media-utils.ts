import type { EditorView } from "@tiptap/pm/view";
import type { IAttachment } from "./types";

export type UploadFn = (
  file: File,
  view: EditorView,
  pos: number,
  pageId: string,
) => void;

export interface MediaUploadOptions {
  validateFn?: (file: File) => boolean;
  onUpload: (file: File, pageId: string) => Promise<IAttachment>;
}
