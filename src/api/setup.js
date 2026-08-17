import api from "./axios";

// Boshlang'ich sozlash: korxona poydevori (bo'lim, ombor, kassa) bormi
// va yetishmayotganini bir tugma bilan yaratish.
export const getSetupStatus = () => api.get("/setup/status");

export const runSetupBootstrap = () => api.post("/setup/bootstrap");

// Sexdagi tugallanmagan ish — ishlab turgan korxonani to'xtatmasdan
// tizimga ko'chirish uchun. Ish haqi hisoblanmaydi, ombor qoldig'iga
// tegilmaydi: sabablari backenddagi izohlarda.
export const getOpeningWip = () => api.get("/setup/opening-wip");
export const createOpeningWip = (data) => api.post("/setup/opening-wip", data);
export const deleteOpeningWip = (id) => api.delete(`/setup/opening-wip/${id}`);

// Korxona saytining matnlari. Ular butun internetga ko'rinadi, shuning
// uchun faqat rahbar va administrator tahrirlay oladi.
export const getSiteContent = () => api.get("/site-content");

export const saveSiteContent = (data) => api.patch("/site-content", data);

// Saytdagi formadan kelgan narx so'rovlari.
export const getSiteLeads = (params) => api.get("/site-leads", { params });

export const updateSiteLead = (id, data) => api.patch(`/site-leads/${id}`, data);
