"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/index.ts
const companyRoutes_1 = require("./companyRoutes");
const productRoutes_1 = require("./productRoutes");
const conversationRoutes_1 = require("./conversationRoutes");
const recommendationRoutes_1 = require("./recommendationRoutes");
exports.default = [
    ...companyRoutes_1.companyRoutes,
    ...productRoutes_1.productRoutes,
    ...conversationRoutes_1.conversationRoutes,
    ...recommendationRoutes_1.recommendationRoutes,
];
