import { Type } from "@sinclair/typebox";
import type { Static } from "@sinclair/typebox";

// -- Request schemas --

export const updateRoleSchema = Type.Object({
    role: Type.Union([Type.Literal("USER"), Type.Literal("ADMIN")]),
});

export type UpdateRoleInput = Static<typeof updateRoleSchema>;

export const userIdParamsSchema = Type.Object({
    id: Type.String(),
});

export type UserIdParams = Static<typeof userIdParamsSchema>;

// -- Response schemas --

export const adminUserSchema = Type.Object({
    id: Type.String(),
    username: Type.String(),
    email: Type.String(),
    role: Type.String(),
    avatar: Type.Union([Type.String(), Type.Null()]),
    bio: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String(),
});

export const usersListResponseSchema = Type.Array(adminUserSchema);

export const statsResponseSchema = Type.Object({
    totalUsers: Type.Number(),
    totalAdmins: Type.Number(),
    totalAnime: Type.Number(),
});

export const messageResponseSchema = Type.Object({
    message: Type.String(),
});
