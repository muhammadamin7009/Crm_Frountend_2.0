/**
 * Kam o'zgaradigan ma'lumotlar uchun qisqa muddatli kesh.
 *
 * Muammo o'lchandi: har sahifa ochilganda `/warehouses` 4–7 marta
 * so'ralardi. Sababi — Sidebar, TopBar va sahifaning o'zi bir-biridan
 * bexabar, bir vaqtda so'rov yuboradi. Omborlar ro'yxati esa kunda bir
 * marta o'zgaradi.
 *
 * Va'da (promise) keshlanadi, javob emas. Shu sababli bir vaqtda kelgan
 * uchta chaqiruv bitta so'rovni kutadi — takror shu yerda kesiladi.
 *
 * Xato kelsa kesh darhol tozalanadi: tarmoq uzilishini bir daqiqa
 * eslab yurish kerak emas.
 */
const store = new Map();
const DEFAULT_TTL = 60_000;

export const cachedGet = (key, loader, ttl = DEFAULT_TTL) => {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.promise;

  const promise = loader().catch((error) => {
    store.delete(key);
    throw error;
  });
  store.set(key, { at: Date.now(), promise });
  return promise;
};

/**
 * Ma'lumot o'zgarganda keshni tashlash.
 *
 * Prefiks bo'yicha: `invalidate("warehouses")` omborlarning barcha
 * parametrli variantlarini oladi. Ombor qo'shilib, ro'yxatda bir daqiqa
 * ko'rinmay tursa foydalanuvchi tizim buzuq deb o'ylaydi.
 */
export const invalidate = (prefix) => {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
};

/** Tizimdan chiqishda: keyingi foydalanuvchi begona ma'lumot ko'rmasin. */
export const clearReferenceCache = () => store.clear();
