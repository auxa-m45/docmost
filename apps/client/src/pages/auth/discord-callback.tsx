import { Center, Loader, Stack, Text } from "@mantine/core";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { notifications } from "@mantine/notifications";
import useAuth from "@/features/auth/hooks/use-auth";
import { useTranslation } from "react-i18next";

export function DiscordCallback() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { discordCallback } = useAuth();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code && state) {
      discordCallback({ code, state }).catch((error) => {
        notifications.show({
          title: t("Authentication Error"),
          message: t("Failed to authenticate with Discord"),
          color: "red",
        });
      });
    }
  }, [searchParams, discordCallback, t]);

  return (
    <Center h="100vh">
      <Stack align="center" my="md">
        <Loader size="lg" />
        <Text size="lg">{t("Authenticating with Discord...")}</Text>
      </Stack>
    </Center>
  );
}
