import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorState } from "@tiptap/pm/state";
import type { MediaUploadOptions, UploadFn } from "../media-utils";
import type { IAttachment } from "../types";

const uploadKey = new PluginKey("audio-upload");

export const AudioUploadPlugin = ({
  placeholderClass,
}: {
  placeholderClass: string;
}) =>
  new Plugin({
    key: uploadKey,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, originalSet) {
        const mappedSet = originalSet.map(tr.mapping, tr.doc);
        // See if the transaction adds or removes any placeholders
        const action = tr.getMeta(uploadKey);
        if (action?.add) {
          const { id, pos } = action.add;

          const placeholder = document.createElement("div");
          placeholder.setAttribute("class", "audio-placeholder");
          const audio = document.createElement("audio");
          audio.setAttribute("class", placeholderClass);
          audio.setAttribute("controls", "true");
          placeholder.appendChild(audio);
          const deco = Decoration.widget(pos + 1, placeholder, {
            id,
          });
          return mappedSet.add(tr.doc, [deco]);
        }
        if (action?.remove) {
          return mappedSet.remove(
            mappedSet.find(
              undefined,
              undefined,
              (spec) => spec.id === action.remove.id,
            ),
          );
        }
        return mappedSet;
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });

function findPlaceholder(state: EditorState, id: Record<string, never>) {
  const decos = uploadKey.getState(state) as DecorationSet;
  const found = decos.find(undefined, undefined, (spec) => spec.id === id);
  return found.length ? found[0]?.from : null;
}

export const handleAudioUpload =
  ({ validateFn, onUpload }: MediaUploadOptions): UploadFn =>
  async (file, view, pos, pageId) => {
    // check if the file is an audio
    const validated = validateFn?.(file);
    // @ts-ignore
    if (!validated) return;

    // A fresh object to act as the ID for this upload
    const id: Record<string, never> = Object.create(null);

    // Replace the selection with a placeholder
    const tr = view.state.tr;
    if (!tr.selection.empty) tr.deleteSelection();

    tr.setMeta(uploadKey, {
      add: {
        id,
        pos,
      },
    });
    view.dispatch(tr);

    await onUpload(file, pageId).then(
      (attachment: IAttachment) => {
        const { schema } = view.state;

        const pos = findPlaceholder(view.state, id);

        // If the content around the placeholder has been deleted, drop
        // the audio
        if (pos == null) return;

        // Otherwise, insert it at the placeholder's position, and remove
        // the placeholder
        if (!attachment) return;

        const node = schema.nodes.audio?.create({
          src: `/files/${attachment.id}/${attachment.fileName}`,
          attachmentId: attachment.id,
          title: attachment.fileName,
          size: attachment.fileSize,
          workerStatus: "pending",
        });
        if (!node) return;

        const transaction = view.state.tr
          .replaceWith(pos, pos, node)
          .setMeta(uploadKey, { remove: { id } });
        view.dispatch(transaction);
      },
      () => {
        // Deletes the audio placeholder on error
        const transaction = view.state.tr
          .delete(pos, pos)
          .setMeta(uploadKey, { remove: { id } });
        view.dispatch(transaction);
      },
    );
  };
