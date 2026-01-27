// src/routes/index.ts
import { companyRoutes } from './companyRoutes';
import { productRoutes } from './productRoutes';
import { conversationRoutes } from './conversationRoutes';
import { recommendationRoutes } from './recommendationRoutes';
import { retailerRoutes } from './retailerRoutes';

export default [
  ...companyRoutes,
  ...productRoutes,
  ...conversationRoutes,
  ...recommendationRoutes,
  ...retailerRoutes
];