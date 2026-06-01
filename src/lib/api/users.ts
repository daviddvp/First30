import { api } from "./client";

export interface UserListItem {
  id: string;
  name: string;
  role: string;
}

export const usersApi = {
  list: () => api.get<UserListItem[]>("/users"),
};
