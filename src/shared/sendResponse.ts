import { Response } from "express";

type IApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPage?: number;
  };
  data?: T;
  stats?: any;
};

const sendResponse = <T>(res: Response, data: IApiResponse<T>): void => {
  const response: IApiResponse<T> = {
    statusCode: data.statusCode,
    success: data.success,
    message: data.message || "",
    meta: data.meta,
    data: data.data || ({} as T),
    stats: data.stats || {},
  };

  res.status(data.statusCode).json(response);
};

export default sendResponse;
