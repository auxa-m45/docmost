import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import { useAtom } from "jotai";
import * as z from "zod";
import { useEffect, useState } from "react";
import { focusAtom } from "jotai-optics";
import { getDiscordConfig, updateDiscordConfig } from "@/features/workspace/services/workspace-service";
import { TextInput, Button, Stack, Switch } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import useUserRole from "@/hooks/use-user-role";
import { useTranslation } from "react-i18next";

const formSchema = z.object({
  enabled: z.boolean(),
  clientId: z.string().min(1, "Client ID is required").optional(),
  clientSecret: z.string().min(1, "Client Secret is required").optional(),
  guildId: z.string().min(1, "Guild ID is required").optional(),
  jitEnabled: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const workspaceAtom = focusAtom(currentUserAtom, (optic) =>
  optic.prop("workspace")
);

export default function WorkspaceDiscordForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser] = useAtom(currentUserAtom);
  const [, setWorkspace] = useAtom(workspaceAtom);
  const { isAdmin } = useUserRole();

  const form = useForm<FormValues>({
    validate: zodResolver(formSchema),
    initialValues: {
      enabled: currentUser?.workspace?.discordEnabled || false,
      clientId: currentUser?.workspace?.discordClientId || "",
      clientSecret: currentUser?.workspace?.discordClientSecret || "",
      guildId: currentUser?.workspace?.discordGuildId || "",
      jitEnabled: currentUser?.workspace?.discordJitEnabled || false,
    },
  });

  async function handleSubmit(data: FormValues) {
    setIsLoading(true);

    try {
      const updatedWorkspace = await updateDiscordConfig({
        enabled: data.enabled || false,
        clientId: data.clientId || "",
        clientSecret: data.clientSecret || "",
        guildId: data.guildId || "",
        jitEnabled: data.jitEnabled || false,
      });
      setWorkspace(updatedWorkspace);
      notifications.show({ message: t("Updated successfully") });
    } catch (err) {
      console.log(err);
      notifications.show({
        message: t("Failed to update Discord settings"),
        color: "red",
      });
    }
    setIsLoading(false);
    form.resetDirty();
  }

  useEffect(() => {
    const loadDiscordConfig = async () => {
      try {
        const config = await getDiscordConfig();
        form.setValues({
          enabled: config.enabled,
          clientId: config.clientId || "",
          clientSecret: config.clientSecret || "",
          guildId: config.guildId || "",
          jitEnabled: config.jitEnabled,
        });
        form.resetDirty();
      } catch (err) {
        console.error(err);
        notifications.show({
          message: t("Failed to load Discord settings"),
          color: "red",
        });
      }
    };

    if (isAdmin) {
      loadDiscordConfig();
    }
  }, [isAdmin, t]);
  
  if (!isAdmin) {
    return null;
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack my="md">
        <Switch
          label={t("Enable Discord Authentication")}
          {...form.getInputProps("enabled", { type: "checkbox" })}
        />

        {form.values.enabled && (
          <>
            <TextInput
              label={t("Client ID")}
              placeholder={t("Discord application client ID")}
              variant="filled"
              {...form.getInputProps("clientId")}
            />

            <TextInput
              label={t("Client Secret")}
              placeholder={t("Discord application client secret")}
              variant="filled"
              type="password"
              {...form.getInputProps("clientSecret")}
            />

            <TextInput
              label={t("Guild ID")}
              placeholder={t("Discord server ID")}
              variant="filled"
              {...form.getInputProps("guildId")}
            />

            <Switch
              label={t("Enable Just-in-Time User Creation")}
              description={t("Automatically create accounts for new Discord users")}
              {...form.getInputProps("jitEnabled", { type: "checkbox" })}
            />
          </>
        )}

        <Button
          type="submit"
          disabled={isLoading || !form.isDirty()}
          loading={isLoading}
        >
          {t("Save")}
        </Button>
      </Stack>
    </form>
  );
}