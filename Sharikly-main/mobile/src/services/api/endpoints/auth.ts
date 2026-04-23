import { axiosInstance, buildApiUrl } from "@/services/api/client";

export type TokenPairResponse = {
  access: string;
  refresh: string;
};

export type MeResponse = Record<string, unknown>;

export async function postLogin(email: string, password: string): Promise<TokenPairResponse> {
  const { data } = await axiosInstance.post<TokenPairResponse>(buildApiUrl("/auth/token/"), {
    email,
    password,
  });
  return data;
}

export async function getMe(): Promise<MeResponse> {
  const { data } = await axiosInstance.get<MeResponse>(buildApiUrl("/auth/me/"));
  return data;
}

export async function postRegister(body: Record<string, unknown>): Promise<unknown> {
  const { data } = await axiosInstance.post(buildApiUrl("/auth/register/"), body);
  return data;
}

export async function postPasswordReset(email: string): Promise<unknown> {
  const { data } = await axiosInstance.post(buildApiUrl("/auth/password-reset/"), { email });
  return data;
}

export async function postPasswordResetConfirm(body: Record<string, unknown>): Promise<unknown> {
  const { data } = await axiosInstance.post(buildApiUrl("/auth/password-reset/confirm/"), body);
  return data;
}

export async function postResendVerification(email: string): Promise<unknown> {
  const { data } = await axiosInstance.post(buildApiUrl("/auth/resend-verification/"), { email });
  return data;
}

export async function getVerifyEmail(params: Record<string, string>): Promise<unknown> {
  const { data } = await axiosInstance.get(buildApiUrl("/auth/verify-email/"), { params });
  return data;
}
