import type { AxiosError } from "axios";

export type FieldErrors = Record<string, string[] | string | undefined>;

export class ApiError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly fieldErrors: FieldErrors | undefined;
  readonly rawBody: unknown;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      fieldErrors?: FieldErrors;
      rawBody?: unknown;
    } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.fieldErrors = options.fieldErrors;
    this.rawBody = options.rawBody;
  }
}

type DrfErrorBody = {
  detail?: string;
  message?: string;
  non_field_errors?: string[];
} & FieldErrors;

export function parseDrfErrorBody(data: unknown): {
  message: string;
  fieldErrors?: FieldErrors;
} {
  if (data === null || data === undefined) {
    return { message: "Request failed" };
  }
  if (typeof data === "string") {
    return { message: data };
  }
  if (typeof data !== "object") {
    return { message: "Request failed" };
  }
  const d = data as DrfErrorBody;
  if (typeof d.detail === "string") {
    return { message: d.detail, fieldErrors: extractFieldErrors(d) };
  }
  if (typeof d.message === "string") {
    return { message: d.message, fieldErrors: extractFieldErrors(d) };
  }
  if (Array.isArray(d.non_field_errors) && d.non_field_errors.length > 0) {
    return { message: d.non_field_errors.join(", "), fieldErrors: extractFieldErrors(d) };
  }
  const fe = extractFieldErrors(d);
  const first = firstFieldMessage(fe);
  return { message: first ?? "Request failed", fieldErrors: fe };
}

function extractFieldErrors(d: DrfErrorBody): FieldErrors | undefined {
  const out: FieldErrors = {};
  let has = false;
  for (const [k, v] of Object.entries(d)) {
    if (k === "detail" || k === "message") continue;
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      out[k] = v as string[];
      has = true;
    } else if (typeof v === "string") {
      out[k] = v;
      has = true;
    }
  }
  return has ? out : undefined;
}

function firstFieldMessage(fe: FieldErrors | undefined): string | undefined {
  if (!fe) return undefined;
  for (const v of Object.values(fe)) {
    if (Array.isArray(v) && v.length > 0) return v[0];
    if (typeof v === "string") return v;
  }
  return undefined;
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  const ax = err as AxiosError<unknown>;
  if (ax?.isAxiosError) {
    const status = ax.response?.status;
    const parsed = parseDrfErrorBody(ax.response?.data);
    return new ApiError(parsed.message, {
      status,
      fieldErrors: parsed.fieldErrors,
      rawBody: ax.response?.data,
    });
  }
  if (err instanceof Error) {
    return new ApiError(err.message);
  }
  return new ApiError("Unknown error");
}
