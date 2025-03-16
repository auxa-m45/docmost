import api from "@/lib/api-client";
import {
  IChangePassword,
  ICollabToken,
  IDiscordCallback,
  IDiscordSetupPassword,
  IForgotPassword,
  ILogin,
  IPasswordReset,
  ISetupWorkspace,
  IVerifyUserToken,
} from "@/features/auth/types/auth.types";
import { IWorkspace } from "@/features/workspace/types/workspace.types.ts";

export async function login(data: ILogin): Promise<void> {
  await api.post<void>("/auth/login", data);
}

export async function logout(): Promise<void> {
  await api.post<void>("/auth/logout");
}

export async function changePassword(
  data: IChangePassword,
): Promise<IChangePassword> {
  const req = await api.post<IChangePassword>("/auth/change-password", data);
  return req.data;
}

export async function setupWorkspace(
  data: ISetupWorkspace,
): Promise<IWorkspace> {
  const req = await api.post<IWorkspace>("/auth/setup", data);
  return req.data;
}

export async function forgotPassword(data: IForgotPassword): Promise<void> {
  await api.post<void>("/auth/forgot-password", data);
}

export async function passwordReset(data: IPasswordReset): Promise<void> {
  await api.post<void>("/auth/password-reset", data);
}

export async function verifyUserToken(data: IVerifyUserToken): Promise<any> {
  return api.post<any>("/auth/verify-token", data);
}

export async function getCollabToken(): Promise<ICollabToken> {
  const req = await api.post<ICollabToken>("/auth/collab-token");
  return req.data;
}

export async function discordCallback(data: IDiscordCallback):Promise<any> {
  const response = await api.get(`/auth/discord/callback`, {
    params: data,
  });
  return response.data;
};

export async function completeDiscordSetup(data: IDiscordSetupPassword): Promise<any> {
  const response = await api.post("/auth/discord/complete-setup", data);
  return response.data;
}
