import api from "./axios";

export const getUsers = (params) => api.get("/users", { params });

export const createUserByAdmin = (data) => api.post("/users/admin", data);

export const createUserByStaff = (data) => api.post("/users/stuff", data);

export const updateUser = (id, data) => api.patch(`/users/${id}`, data);

export const updateMe = (data) => api.patch("/users/me", data);

export const getMe = () => api.get("/users/me");
export const getMySessions = () => api.get("/users/me/sessions");
export const revokeSession = (id) => api.delete(`/users/me/sessions/${id}`);
export const revokeOtherSessions = () => api.delete("/users/me/sessions/others");

export const deleteUser = (id) => api.delete(`/users/${id}`);

export const restoreUser = (id) => api.patch(`/users/${id}/restore`);

export const permanentlyDeleteUser = (id) => api.delete(`/users/${id}/permanent`);

export const updateUserImage = (file) => {
  const formData = new FormData();
  formData.append("user_image", file);

  return api.patch("/me/image", formData);
};

export const getUser = (id) => {
  return api.get(`/users/${id}`);
};
