# Discord認証後のパスワード設定画面の実装

## 概要
Discord認証後、新規ユーザーがパスワードを設定するための画面を実装します。

## 実装手順

### 1. 型定義の追加
**コミット**: `feat(auth): add types for Discord password setup`

`apps/client/src/features/auth/types/auth.types.ts`に以下の型を追加：
```typescript
export interface IDiscordPendingUser {
  name: string;
  email: string;
  workspaceId: string;
  discordId: string;
  avatarUrl: string;
}

export interface IDiscordSetupPassword {
  pendingUser: IDiscordPendingUser;
  password: string;
}
```

### 2. APIクライアントの実装
**コミット**: `feat(auth): add API client for Discord password setup`

`apps/client/src/features/auth/services/auth-service.ts`に以下のメソッドを追加：
```typescript
export async function completeDiscordSetup(data: IDiscordSetupPassword): Promise<{ token: string }> {
  const response = await api.post<{ token: string }>("/auth/discord/complete-setup", data);
  return response.data;
}
```

### 3. バリデーションスキーマの実装
**コミット**: `feat(auth): add validation schema for Discord setup form`

`apps/client/src/features/auth/schemas/discord-setup.schema.ts`を作成：
```typescript
import * as z from "zod";

export const discordSetupSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export type DiscordSetupFormValues = z.infer<typeof discordSetupSchema>;
```

### 4. フォームコンポーネントの実装
**コミット**: `feat(auth): add Discord setup form component`

`apps/client/src/features/auth/components/discord-setup-form.tsx`を作成：
```typescript
import { useForm, zodResolver } from "@mantine/form";
import { PasswordInput, Button, Stack } from "@mantine/core";
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
```

### 5. パスワード設定ページの実装
**コミット**: `feat(auth): add Discord setup page`

`apps/client/src/pages/auth/discord-setup.tsx`を作成：
```typescript
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
        password: values.password
      });
      
      // トークンをクッキーに保存する処理は別途実装
      navigate("/");
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to complete setup",
        color: "red"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Container size={420} my={40}>
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} ta="center" mb="lg">
          Set Password
        </Title>
        <Text size="sm" mb="lg">
          Welcome {pendingUser.name}! Please set a password to complete your account setup.
        </Text>
        <DiscordSetupForm onSubmit={handleSubmit} isLoading={isLoading} />
      </Paper>
    </Container>
  );
}
```

### 6. ルーティングの追加
**コミット**: `feat(auth): add route for Discord setup page`

`apps/client/src/App.tsx`に以下のルートを追加：
```typescript
{
  path: "auth/discord-setup",
  element: <DiscordSetup />,
}
```

### 7. i18n対応（後日実装）
**コミット**: `docs(i18n): add translation strings for Discord setup`

以下の文字列を翻訳対象として記録：

#### バリデーションメッセージ
- "Password must be at least 8 characters"
- "Password must contain at least one uppercase letter"
- "Password must contain at least one lowercase letter"
- "Password must contain at least one number"
- "Passwords don't match"

#### フォームラベル
- "Password"
- "Confirm password"
- "Your password"
- "Confirm your password"
- "Complete Setup"

#### ページコンテンツ
- "Set Password"
- "Welcome {name}! Please set a password to complete your account setup."

#### エラーメッセージ
- "Error"
- "Failed to complete setup"

## テスト計画

以下のテストを実装予定：
1. バリデーションのテスト
   - パスワードの長さ
   - 大文字小文字数字の含有
   - パスワード確認の一致
2. フォームコンポーネントのテスト
   - 入力フィールドの存在
   - エラーメッセージの表示
   - 送信ボタンの動作
3. API通信のテスト
   - 成功時の動作
   - エラー時の動作
4. エラーハンドリングのテスト
   - 通信エラー
   - バリデーションエラー
   - 不正なデータ

**コミット**: `test(auth): add tests for Discord setup`
