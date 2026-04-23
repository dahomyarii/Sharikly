import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    username: z.string().min(2, "Username must be at least 2 characters"),
    password: z.string().min(8, "Use at least 8 characters"),
    password_confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
