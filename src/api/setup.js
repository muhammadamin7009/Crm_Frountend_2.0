import api from "./axios";

// Boshlang'ich sozlash: korxona poydevori (bo'lim, ombor, kassa) bormi
// va yetishmayotganini bir tugma bilan yaratish.
export const getSetupStatus = () => api.get("/setup/status");

export const runSetupBootstrap = () => api.post("/setup/bootstrap");
