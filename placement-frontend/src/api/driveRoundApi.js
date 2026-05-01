import axios from "./axios";

export const createRound = (workflowId, data) =>
  axios.post(`/drive-round/${workflowId}/rounds`, data);