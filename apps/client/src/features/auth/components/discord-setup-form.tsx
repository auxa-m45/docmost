import { useForm } from "@mantine/form";
import { PasswordInput, Button, Stack } from "@mantine/core";
import { zodResolver } from "@mantine/form";
import { discordSetupSchema, DiscordSetupFormValues } from "../schemas/discord-setup.schema";

interface DiscordSetupFormProps {
  onSubmit: (values: DiscordSetupFormValues) => Promise<void>;
  isLoading?: boolean;
}

export function DiscordSetupForm({ onSubmit, isLoading }: DiscordSetupFormProps) {
  const form = useForm<DiscordSetupFormValues>({
    validate: zodResolver(discordSetupSchema),
    initialValues: {
      password: "",
      confirmPassword: ""
    }
  });

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        <PasswordInput
          label="Password"
          placeholder="Your password"
          {...form.getInputProps("password")}
        />
        <PasswordInput
          label="Confirm password"
          placeholder="Confirm your password"
          {...form.getInputProps("confirmPassword")}
        />
        <Button type="submit" loading={isLoading}>
          Complete Setup
        </Button>
      </Stack>
    </form>
  );
}
