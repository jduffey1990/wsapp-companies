// src/routes/index.ts
import { companyRoutes } from './companyRoutes';
import { productRoutes } from './productRoutes';
import { conversationRoutes } from './conversationRoutes';
import { recommendationRoutes } from './recommendationRoutes';

export default [
  ...companyRoutes,
  ...productRoutes,
  ...conversationRoutes,
  ...recommendationRoutes,
];