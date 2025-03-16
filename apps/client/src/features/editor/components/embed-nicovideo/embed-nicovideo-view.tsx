import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  ActionIcon,
  AspectRatio,
  Button,
  Card,
  FocusTrap,
  Group,
  Popover,
  Text,
  TextInput,
} from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
import { z } from "zod";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

// ニコニコ動画のURLパターンを拡張（nico.msも含む）
const NICOVIDEO_REGEX = /^https?:\/\/(www\.|sp\.)?(nicovideo\.jp\/watch|nico\.ms)\/([a-z]{0,2}[0-9]+)/i;

const schema = z.object({
  url: z
    .string()
    .trim()
    .url({ message: i18n.t("Please enter a valid url") }),
});

export default function EmbedNicovideoView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { node, selected, updateAttributes } = props;
  const { src } = node.attrs;
  const [opened, setOpened] = useState(!src);

  const embedForm = useForm<{ url: string }>({
    initialValues: {
      url: src || "",
    },
    validate: zodResolver(schema),
  });

  // 動画IDを抽出するロジックを修正
  const videoId = useMemo(() => {
    if (!src) return null;
    const match = src.match(NICOVIDEO_REGEX);
    return match?.[3] || null;
  }, [src]);

  async function onSubmit(data: { url: string }) {
    const match = data.url.match(NICOVIDEO_REGEX);
    if (match && match[3]) {
      updateAttributes({ src: data.url });
      setOpened(false);
    } else {
      notifications.show({
        message: t("Invalid Nicovideo link"),
        position: "top-right",
        color: "red",
      });
    }
  }

  return (
    <NodeViewWrapper>
      {videoId ? (
        <div className={clsx("relative group", selected ? "ProseMirror-selectednode" : "")}>
          <AspectRatio ratio={16 / 9}>
            <iframe
              src={`https://embed.nicovideo.jp/watch/${videoId}?allowScriptAccess=always`}
              width="100%"
              height="100%"
              style={{ border: "none" }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </AspectRatio>
          {/* 編集ボタン（選択時にのみ表示） */}
          {selected && (
            <ActionIcon 
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" 
              onClick={() => setOpened(true)}
            >
              <IconEdit size={18} />
            </ActionIcon>
          )}
        </div>
      ) : (
        <Popover width={300} position="bottom" withArrow shadow="md" opened={opened} onChange={setOpened}>
          <Popover.Target>
            <Card
              radius="md"
              p="xs"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              withBorder
              className={clsx(selected ? "ProseMirror-selectednode" : "")}
              onClick={() => setOpened(true)}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <ActionIcon variant="transparent" color="gray">
                  <IconEdit size={18} />
                </ActionIcon>

                <Text component="span" size="lg" c="dimmed">
                  {t("Embed Nicovideo")}
                </Text>
              </div>
            </Card>
          </Popover.Target>
          <Popover.Dropdown bg="var(--mantine-color-body)">
            <form onSubmit={embedForm.onSubmit(onSubmit)}>
              <FocusTrap active={opened}>
                <TextInput
                  placeholder={t("Enter Nicovideo link (e.g. https://www.nicovideo.jp/watch/sm12345678)")}
                  key={embedForm.key("url")}
                  {...embedForm.getInputProps("url")}
                  data-autofocus
                />
              </FocusTrap>

              <Group justify="center" mt="xs">
                <Button type="submit">{t("Embed link")}</Button>
              </Group>
            </form>
          </Popover.Dropdown>
        </Popover>
      )}
    </NodeViewWrapper>
  );
}