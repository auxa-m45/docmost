export interface ILogin {
  email: string;
  password: string;
}

export interface IRegister {
  name?: string;
  email: string;
  password: string;
}

export interface ISetupWorkspace {
  workspaceName: string;
  name: string;
  email: string;
  password: string;
}

export interface IChangePassword {
  oldPassword: string;
  newPassword: string;
}

export interface IForgotPassword {
  email: string;
}

export interface IPasswordReset {
  token?: string;
  newPassword: string;
}

export interface IVerifyUserToken {
  token: string;
  type: string;
}

export interface ICollabToken {
  token: string;
}

export interface IDiscordPendingUser {
  token: string;
  workspaceId: string;
  id: string
}

export interface IDiscordSetupPassword {
  pendingUser: IDiscordPendingUser;
  password: string;
}

export interface IDiscordCallback {
  code: string;
  state: string;
}
