import axios from "./axios";

export const getAnalyticsSummary = () => {
  return axios.get(`/admin/analytics/summary`);
};
