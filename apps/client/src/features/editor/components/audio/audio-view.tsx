import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useMemo } from "react";
import { getFileUrl } from "@/lib/config.ts";
import clsx from "clsx";

export default function AudioView(props: NodeViewProps) {
  const { node, selected } = props;
  const { src, width, align } = node.attrs;

  const alignClass = useMemo(() => {
    if (align === "left") return "alignLeft";
    if (align === "right") return "alignRight";
    if (align === "center") return "alignCenter";
    return "alignCenter";
  }, [align]);

  return (
    <NodeViewWrapper>
      <audio
        preload="metadata"
        controls
        src={getFileUrl(src)}
        className={clsx(selected ? "ProseMirror-selectednode" : "", alignClass)}
      />
      {/* <video
        preload="metadata"
        width={width}
        controls
        src={getFileUrl(src)}
        className={clsx(selected ? "ProseMirror-selectednode" : "", alignClass)}
      /> */}
    </NodeViewWrapper>
  );
}
