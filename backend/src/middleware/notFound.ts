import { NextFunction, Request, Response } from 'express';
import { IApiResponse } from '../types';

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const response: IApiResponse = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
  };
  
  res.status(404).json(response);
};
