import {
  BubbleMenu as BaseBubbleMenu,
  findParentNode,
  posToDOMRect,
} from "@tiptap/react";
import React, { useCallback } from "react";
import { sticky } from "tippy.js";
import { Node as PMNode } from "prosemirror-model";
import {
  EditorMenuProps,
  ShouldShowProps,
} from "@/features/editor/components/table/types/types.ts";
import { ActionIcon, Tooltip } from "@mantine/core";
import {
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignRight,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

export function AudioMenu({ editor }: EditorMenuProps) {
  const { t } = useTranslation();
  const shouldShow = useCallback(
    ({ state }: ShouldShowProps) => {
      if (!state) {
        return false;
      }

      return editor.isActive("audio");
    },
    [editor],
  );

  const getReferenceClientRect = useCallback(() => {
    const { selection } = editor.state;
    const predicate = (node: PMNode) => node.type.name === "audio";
    const parent = findParentNode(predicate)(selection);

    if (parent) {
      const dom = editor.view.nodeDOM(parent?.pos) as HTMLElement;
      return dom.getBoundingClientRect();
    }

    return posToDOMRect(editor.view, selection.from, selection.to);
  }, [editor]);

  const alignAudioLeft = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setAudioAlign("left")
      .run();
  }, [editor]);

  const alignAudioCenter = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setAudioAlign("center")
      .run();
  }, [editor]);

  const alignAudioRight = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setAudioAlign("right")
      .run();
  }, [editor]);

  return (
    <BaseBubbleMenu
      editor={editor}
      pluginKey="audio-menu"
      updateDelay={0}
      tippyOptions={{
        getReferenceClientRect,
        offset: [0, 8],
        zIndex: 99,
        popperOptions: {
          modifiers: [{ name: "flip", enabled: false }],
        },
        plugins: [sticky],
        sticky: "popper",
      }}
      shouldShow={shouldShow}
    >
      <ActionIcon.Group className="actionIconGroup">
        <Tooltip position="top" label={t("Align left")}>
          <ActionIcon
            onClick={alignAudioLeft}
            size="lg"
            aria-label={t("Align left")}
            variant={
              editor.isActive("audio", { align: "left" }) ? "light" : "default"
            }
          >
            <IconLayoutAlignLeft size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip position="top" label={t("Align center")}>
          <ActionIcon
            onClick={alignAudioCenter}
            size="lg"
            aria-label={t("Align center")}
            variant={
              editor.isActive("audio", { align: "center" })
                ? "light"
                : "default"
            }
          >
            <IconLayoutAlignCenter size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip position="top" label={t("Align right")}>
          <ActionIcon
            onClick={alignAudioRight}
            size="lg"
            aria-label={t("Align right")}
            variant={
              editor.isActive("audio", { align: "right" }) ? "light" : "default"
            }
          >
            <IconLayoutAlignRight size={18} />
          </ActionIcon>
        </Tooltip>
      </ActionIcon.Group>
    </BaseBubbleMenu>
  );
}

export default AudioMenu;
