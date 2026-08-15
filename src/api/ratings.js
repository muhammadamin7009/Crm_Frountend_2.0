import api from "./axios";

// Shu hafta men kimga baho qo'ya olaman va nima qo'ygandim.
export const getRateablePeople = () => api.get("/ratings/rateable");

export const saveRating = (data) => api.post("/ratings", data);

// O'z reytingim — kim qo'ygani ko'rinmaydi, faqat o'rtacha.
export const getMyRating = (params) => api.get("/ratings/me", { params });

// Butun korxona jadvali — boshliq va rahbar uchun.
export const getRatings = (params) => api.get("/ratings", { params });
export const getWorkerRating = (id, params) => api.get(`/ratings/worker/${id}`, { params });
