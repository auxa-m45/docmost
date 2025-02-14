import { currentUserAtom } from "@/features/user/atoms/current-user-atom.ts";
import { useAtom } from "jotai";
import * as z from "zod";
import { useState } from "react";
import { focusAtom } from "jotai-optics";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";
import { IWorkspace } from "@/features/workspace/types/workspace.types.ts";
import { Text, Select, Group } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import useUserRole from "@/hooks/use-user-role.tsx";
import { useTranslation } from "react-i18next";
import { ICurrentUser } from "@/features/user/types/user.types";

const formSchema = z.object({
  defaultLocale: z.string().min(4),
});

type FormValues = z.infer<typeof formSchema>;

const workspaceAtom = focusAtom(currentUserAtom, (optic) =>
  optic.prop("workspace")
);

export default function WorkspaceDefaultLanguageForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser] = useAtom(currentUserAtom);
  const [, setWorkspace] = useAtom(workspaceAtom);
  const { isAdmin } = useUserRole();

  const form = useForm<FormValues>({
    validate: zodResolver(formSchema),
    initialValues: {
      defaultLocale: currentUser?.workspace?.defaultLocale,
    },
  });

  async function handleChange(data: Partial<IWorkspace>) {
    setIsLoading(true);

    try {
      const updatedWorkspace = await updateWorkspace(data);
      setWorkspace(updatedWorkspace);
      notifications.show({ message: t("Updated successfully") });
    } catch (err) {
      console.log(err);
      notifications.show({
        message: t("Failed to update data"),
        color: "red",
      });
    }
    setIsLoading(false);
    form.resetDirty();
  }

  return (
    <Group justify="space-between" wrap="nowrap" gap="xl">
      <div>
        <Text size="md">{t("Default Locale")}</Text>
        <Text size="sm" c="dimmed">
          {t("Select workspace default language.")}
        </Text>
      </div>

      <WorkspaceLanguageSwitcher
        handleChange={handleChange}
        isAdmin={isAdmin}
        currentUser={currentUser}
      />
    </Group>
  );
}

function WorkspaceLanguageSwitcher({
  handleChange,
  isAdmin,
  currentUser,
}: {
  handleChange: (data: Partial<IWorkspace>) => void;
  isAdmin: boolean;
  currentUser: ICurrentUser;
}) {
  const { t } = useTranslation();
  const [language, setLanguage] = useState(
    currentUser?.workspace.defaultLocale === "en" ? "en-US" : currentUser.workspace.defaultLocale
  );

  return (
    <>
      <Select
        data={[
          { value: "en-US", label: "English (US)" },
          { value: "de-DE", label: "Deutsch (German)" },
          { value: "fr-FR", label: "Français (French)" },
          { value: "es-ES", label: "Español (Spanish)" },
          { value: "pt-BR", label: "Português (Brasil)" },
          { value: "it-IT", label: "Italiano (Italian)" },
          { value: "ja-JP", label: "日本語 (Japanese)" },
          { value: "ko-KR", label: "한국어 (Korean)" },
          { value: "ru-RU", label: "Русский (Russian)" },
          { value: "zh-CN", label: "中文 (简体)" },
        ]}
        disabled={!isAdmin}
        value={language || "en-US"}
        onChange={(e) => {
          handleChange({ defaultLocale: e });
          setLanguage(e);
        }}
        allowDeselect={false}
        checkIconPosition="right"
      />
    </>
  );
}
