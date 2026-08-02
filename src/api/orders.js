import api from "./axios";

const removeEmptyParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined,
    ),
  );

export const getOrders = (params) => api.get("/orders", { params: removeEmptyParams(params) });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post("/orders", data);
export const updateOrder = (id, data) => api.patch(`/orders/${id}`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
export const convertOrderToSale = (id, data) => api.post(`/orders/${id}/convert-to-sale`, data);
export const getOrderTasks = (id) => api.get(`/orders/${id}/tasks`);
export const createOrderTask = (id, data) => api.post(`/orders/${id}/tasks`, data);
export const deleteOrderTask = (id) => api.delete(`/order-tasks/${id}`);
export const getMyOrderTasks = (params) =>
  api.get("/order-tasks/me", { params: removeEmptyParams(params) });
export const claimOrderTask = (id, quantity) => api.post(`/order-tasks/${id}/claim`, { quantity });
export const updateOrderTaskProgress = (id, data) => api.patch(`/order-tasks/${id}/progress`, data);
export const getWorkflowWorkers = () => api.get("/order-workflow/workers");
export const assignWorkflowWorkerDepartment = (id, department_id) =>
  api.patch(`/order-workflow/workers/${id}/department`, { department_id });
