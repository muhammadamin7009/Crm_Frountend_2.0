import api from "./axios";

// Partiya — bir ishlab chiqarish yo'li. Uni kroy kesgan material va kosib
// ishlatgan padoj ajratadi, shuning uchun material/padoj qo'lda kiritilmaydi:
// server ish yozuvlaridagi haqiqiy sarfdan o'zi aniqlaydi.
export const getProductionBatches = (params) => api.get("/production-batches", { params });

export const getProductionBatch = (id) => api.get(`/production-batches/${id}`);

export const createProductionBatch = (data) => api.post("/production-batches", data);

/**
 * Partiyani yopish.
 *
 * Tugamagan ish bo'lsa server rad etadi va nima qolganini aytadi.
 * `force` — foydalanuvchi shundan keyin ham yopishga rozi bo'lgani.
 */
export const completeProductionBatch = (id, force = false) =>
  api.patch(`/production-batches/${id}/complete`, { force });
