import { ApiError, parseDrfErrorBody, toApiError } from "@/core/errors/ApiError";
import type { AxiosError } from "axios";

describe("parseDrfErrorBody", () => {
  it("parses string detail", () => {
    const r = parseDrfErrorBody({ detail: "Invalid token." });
    expect(r.message).toBe("Invalid token.");
  });

  it("parses field errors", () => {
    const r = parseDrfErrorBody({ email: ["This field is required."] });
    expect(r.message).toBe("This field is required.");
    expect(r.fieldErrors?.email).toEqual(["This field is required."]);
  });
});

describe("toApiError", () => {
  it("passes through ApiError", () => {
    const e = new ApiError("x");
    expect(toApiError(e)).toBe(e);
  });

  it("maps axios-like errors", () => {
    const ax = {
      isAxiosError: true,
      response: { status: 400, data: { detail: "Bad" } },
    } as AxiosError<{ detail: string }>;
    const r = toApiError(ax);
    expect(r).toBeInstanceOf(ApiError);
    expect(r.message).toBe("Bad");
    expect(r.status).toBe(400);
  });
});
