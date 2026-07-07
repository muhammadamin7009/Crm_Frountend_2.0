import api from "./axios";

export const getPermissionSettings = () => api.get("/permissions");

export const getUserPermissions = (id) => api.get(`/permissions/users/${id}`);

export const updateUserPermissions = (id, permissions) =>
  api.put(`/permissions/users/${id}`, { permissions });
