import api from "./axios";

export const getPayrollPeriods = (params) => api.get("/payroll-periods", { params });
export const getPayrollPeriod = (id) => api.get(`/payroll-periods/${id}`);
export const createPayrollPeriod = (data) => api.post("/payroll-periods", data);
export const updatePayrollLine = (id, data) => api.patch(`/payroll-lines/${id}`, data);
export const closePayrollPeriod = (id) => api.post(`/payroll-periods/${id}/close`);
export const getExpenseCategories = () => api.get("/expense-categories");
export const createExpenseCategory = (data) => api.post("/expense-categories", data);
export const getExpenses = (params) => api.get("/expenses", { params });
export const createExpense = (data) => api.post("/expenses", data);
export const getFinancialAccounts = () => api.get("/financial-accounts");
export const createFinancialAccount = (data) => api.post("/financial-accounts", data);
export const getCashTransactions = (params) => api.get("/cash-transactions", { params });
export const createCashTransaction = (data) => api.post("/cash-transactions", data);
export const getClientReturns = (params) => api.get("/client-returns", { params });
export const createClientReturn = (data) => api.post("/client-returns", data);
export const getProfitLoss = (params) => api.get("/reports/profit-loss", { params });
