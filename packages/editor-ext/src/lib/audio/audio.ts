import { ReactNodeViewRenderer } from "@tiptap/react";
import { AudioUploadPlugin } from "./audio-upload";
import { type Range, Node } from "@tiptap/core";

export interface AudioOptions {
  view: any;
  HTMLAttributes: Record<string, string>;
}

export interface AudioAttributes {
  src?: string;
  title?: string;
  align?: string;
  attachmentId?: string;
  size?: number;
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
