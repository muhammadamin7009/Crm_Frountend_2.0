import api from "./axios";
import { cachedGet, invalidate } from "./referenceCache";

// Bo'limlar deyarli o'zgarmaydi, lekin zakaz, ishlab chiqarish va xodimlar
// sahifalarining hammasi ularni qaytadan so'raydi.
export const getDepartments = (params) =>
  cachedGet(`departments:${JSON.stringify(params || {})}`, () =>
    api.get("/departments", { params }),
  );

const afterDepartmentChange = (response) => {
  invalidate("departments");
  return response;
};

export const createDepartment = (data) =>
  api.post("/departments", data).then(afterDepartmentChange);
export const updateDepartment = (id, data) =>
  api.patch(`/departments/${id}`, data).then(afterDepartmentChange);
