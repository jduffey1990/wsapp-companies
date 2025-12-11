"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
class AuthService {
    /**
     * Validate JWT token for Hapi's auth strategy.
     * Extracts user info from token payload and returns as credentials.
     */
    static validateToken(decoded, _request, _h) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const payload = (_c = (_b = (_a = decoded === null || decoded === void 0 ? void 0 : decoded.decoded) === null || _a === void 0 ? void 0 : _a.payload) !== null && _b !== void 0 ? _b : decoded === null || decoded === void 0 ? void 0 : decoded.payload) !== null && _c !== void 0 ? _c : decoded;
            // Validate required fields
            if (!(payload === null || payload === void 0 ? void 0 : payload.id) || !(payload === null || payload === void 0 ? void 0 : payload.email) || !(payload === null || payload === void 0 ? void 0 : payload.companyId)) {
                return { isValid: false };
            }
            // The JWT signature is already verified by Hapi's JWT plugin
            // The expiration is already checked by Hapi (maxAgeSec setting)
            // So if we got here, the token is cryptographically valid and not expired
            return {
                isValid: true,
                credentials: {
                    userId: payload.id,
                    email: payload.email,
                    companyId: payload.companyId,
                    name: payload.name
                }
            };
        });
    }
}
exports.AuthService = AuthService;
