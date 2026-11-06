import { v7 as uuidv7 } from "uuid";
import type { StoredUser } from "@app/shared";

const users: StoredUser[] = [];

export const findByUsername = (username: string): StoredUser | undefined =>
    users.find((u) => u.username === username);

export const findById = (id: string): StoredUser | undefined =>
    users.find((u) => u.id === id);

export const addUser = (username: string, passwordHash: string): StoredUser | undefined => {
    if (findByUsername(username)) {
        return undefined;
    }

    const newUser: StoredUser = {
        id: uuidv7(),
        username,
        passwordHash
    };

    users.push(newUser);
    return newUser;
};