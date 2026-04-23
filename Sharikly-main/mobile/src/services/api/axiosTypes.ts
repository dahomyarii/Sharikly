import type { InternalAxiosRequestConfig } from "axios";

export type EkraAxiosRequestConfig = InternalAxiosRequestConfig & {
  __retried401?: boolean;
  __retried?: boolean;
};
