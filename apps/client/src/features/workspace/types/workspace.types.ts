export interface IWorkspace {
  id: string;
  name: string;
  description: string;
  logo: string;
  hostname: string;
  defaultSpaceId: string;
  customDomain: string;
  enableInvite: boolean;
  inviteCode: string;
  settings: any;
  createdAt: Date;
  updatedAt: Date;
  discordEnabled: boolean;
  discordClientId: string | null;
  discordClientSecret: string | null;
  discordGuildId: string | null;
  discordJitEnabled: boolean;
}

export interface ICreateInvite {
  role: string;
  emails: string[];
  groupIds: string[];
}

export interface IInvitation {
  id: string;
  role: string;
  email: string;
  workspaceId: string;
  invitedById: string;
  createdAt: Date;
}

export interface IAcceptInvite {
  invitationId: string;
  name: string;
  password: string;
  token: string;
}
