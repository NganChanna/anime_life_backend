import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

export const createUserSchema = Type.Object({
    username: Type.String({ minLength: 3 }),
    email: Type.String({ format: "email" }),
    password: Type.String({ minLength: 6 }),
});

export type CreateUserInput = Static<typeof createUserSchema>;

export const userResponseSchema = Type.Object({
    id: Type.String(),
    username: Type.String(),
    email: Type.String(),
    role: Type.String(),
    avatar: Type.Optional(Type.String()),
    bio: Type.Optional(Type.String()),
});

export const loginUserSchema = Type.Object({
    email: Type.String({ format: "email" }),
    password: Type.String(),
});

export type LoginUserInput = Static<typeof loginUserSchema>;

export const loginResponseSchema = Type.Object({
    accessToken: Type.String(),
});

export const updateProfileSchema = Type.Object({
    username: Type.Optional(Type.String({ minLength: 3 })),
    bio: Type.Optional(Type.String()),
    avatar: Type.Optional(Type.String()),
});

export type UpdateProfileInput = Static<typeof updateProfileSchema>;

export const changePasswordSchema = Type.Object({
    currentPassword: Type.String({ minLength: 6 }),
    newPassword: Type.String({ minLength: 6 }),
});

export type ChangePasswordInput = Static<typeof changePasswordSchema>;

export const messageResponseSchema = Type.Object({
    message: Type.String(),
});
