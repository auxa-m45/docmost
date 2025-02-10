import { Container, Title, Paper, Text } from "@mantine/core";
import { useSearchParams, useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { DiscordSetupForm } from "@/features/auth/components/discord-setup-form";
import { completeDiscordSetup } from "@/features/auth/services/auth-service";
import { IDiscordPendingUser } from "@/features/auth/types/auth.types";
import type { DiscordSetupFormValues } from "@/features/auth/schemas/discord-setup.schema";

export function DiscordSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pendingUserData = searchParams.get("data");

  if (!pendingUserData) {
    navigate("/login");
    return null;
  }

  const pendingUser: IDiscordPendingUser = JSON.parse(
    decodeURIComponent(pendingUserData)
  );

  async function handleSubmit(values: DiscordSetupFormValues) {
    try {
      setIsLoading(true);
      const { token } = await completeDiscordSetup({
        pendingUser,
        password: values.password,
      });

      navigate("/");
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to complete setup",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Container size={420} my={40}>
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} ta="center" mb="lg">
          パスワードの設定
        </Title>
        <Text size="sm" mb="lg">
          ようこそ！アカウントのセットアップを完了するためにパスワードを設定してください。
        </Text>
        <DiscordSetupForm onSubmit={handleSubmit} isLoading={isLoading} />
      </Paper>
    </Container>
  );
}
