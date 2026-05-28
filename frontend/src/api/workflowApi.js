import axios from "./axios";

export const createWorkflow = (driveId, data) =>
  axios.post(`/workflow/${driveId}/workflow`, data);