import { ReactNodeViewRenderer } from "@tiptap/react";
import { AudioUploadPlugin } from "./audio-upload";
import { type Range, Node } from "@tiptap/core";
import type { ComponentType } from "react";
import type { NodeViewProps } from "@tiptap/react";

export interface AudioOptions {
  view: ComponentType<NodeViewProps>;
  HTMLAttributes: Record<string, string>;
}

export interface AudioAttributes {
  src?: string;
  title?: string;
  align?: string;
  attachmentId?: string;
  size?: number;
  previewUrl?: string;
  workerStatus?: "pending" | "converting" | "done" | "error";
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audioBlock: {
      setAudio: (attributes: AudioAttributes) => ReturnType;
      setAudioAt: (
        attributes: AudioAttributes & { pos: number | Range },
      ) => ReturnType;
      setAudioAlign: (align: "left" | "center" | "right") => ReturnType;
    };
  }
}

export const TiptapAudio = Node.create<AudioOptions>({
  name: "audio",

  group: "block",
  isolating: true,
  atom: true,
  defining: true,
  draggable: true,

  addOptions() {
    return {
      view: null,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) => element.getAttribute("src"),
        renderHTML: (attributes) => ({
          src: attributes.src,
        }),
      },
      attachmentId: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-attachment-id"),
        renderHTML: (attributes: AudioAttributes) => ({
          "data-attachment-id": attributes.attachmentId,
        }),
      },
      size: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-size"),
        renderHTML: (attributes: AudioAttributes) => ({
          "data-size": attributes.size,
        }),
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align"),
        renderHTML: (attributes: AudioAttributes) => ({
          "data-align": attributes.align,
        }),
      },
      previewUrl: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-preview-url"),
        renderHTML: (attributes: AudioAttributes) => ({
          "data-preview-url": attributes.previewUrl,
        }),
      },
      workerStatus: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-worker-status"),
        renderHTML: (attributes: AudioAttributes) => ({
          "data-worker-status": attributes.workerStatus,
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "audio",
      { controls: "true", preload: "metadata", ...HTMLAttributes },
      ["source", HTMLAttributes],
    ];
  },

  addCommands() {
    return {
      setAudio:
        (attrs: AudioAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "audio",
            attrs: attrs,
          });
        },

      setAudioAlign:
        (align) =>
        ({ commands }) =>
          commands.updateAttributes("audio", { align }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(this.options.view);
  },

  addProseMirrorPlugins() {
    return [
      AudioUploadPlugin({
        placeholderClass: "audio-upload",
      }),
    ];
  },
});
