"use strict";
// src/models/Company.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmptyProfile = createEmptyProfile;
exports.calculateCompletionScore = calculateCompletionScore;
// ============ UTILITY FUNCTIONS ============
/**
 * Create initial empty profile for new company
 */
function createEmptyProfile() {
    return {
        verified: false,
        coreIdentity: {},
        marketPositioning: {},
        wholesaleOperations: {},
        operations: {},
        brandStyle: {},
        socialMedia: {},
        completionScore: 0
    };
}
/**
 * Calculate profile completion score based on filled fields
 */
function calculateCompletionScore(profile) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5;
    const allFields = [
        // Core Identity (weight: 35%)
        (_a = profile.coreIdentity) === null || _a === void 0 ? void 0 : _a.brandName,
        (_b = profile.coreIdentity) === null || _b === void 0 ? void 0 : _b.logo,
        (_c = profile.coreIdentity) === null || _c === void 0 ? void 0 : _c.tagline,
        (_d = profile.coreIdentity) === null || _d === void 0 ? void 0 : _d.description,
        (_e = profile.coreIdentity) === null || _e === void 0 ? void 0 : _e.productCategory,
        (_f = profile.coreIdentity) === null || _f === void 0 ? void 0 : _f.industry,
        (_g = profile.coreIdentity) === null || _g === void 0 ? void 0 : _g.categories,
        (_h = profile.coreIdentity) === null || _h === void 0 ? void 0 : _h.hqLocation,
        (_j = profile.coreIdentity) === null || _j === void 0 ? void 0 : _j.contactEmail,
        (_k = profile.coreIdentity) === null || _k === void 0 ? void 0 : _k.website,
        (_l = profile.coreIdentity) === null || _l === void 0 ? void 0 : _l.foundingYear,
        // Market Positioning (weight: 25%)
        (_m = profile.marketPositioning) === null || _m === void 0 ? void 0 : _m.priceTier,
        (_o = profile.marketPositioning) === null || _o === void 0 ? void 0 : _o.salesChannels,
        (_p = profile.marketPositioning) === null || _p === void 0 ? void 0 : _p.targetMarkets,
        (_q = profile.marketPositioning) === null || _q === void 0 ? void 0 : _q.productCategories,
        // Wholesale Operations (weight: 15%)
        (_r = profile.wholesaleOperations) === null || _r === void 0 ? void 0 : _r.moq,
        (_s = profile.wholesaleOperations) === null || _s === void 0 ? void 0 : _s.leadTime,
        (_t = profile.wholesaleOperations) === null || _t === void 0 ? void 0 : _t.casePackSize,
        // Operations (weight: 10%)
        (_u = profile.operations) === null || _u === void 0 ? void 0 : _u.fulfillmentMethod,
        (_v = profile.operations) === null || _v === void 0 ? void 0 : _v.returnPolicy,
        // Brand Style (weight: 10%)
        (_w = profile.brandStyle) === null || _w === void 0 ? void 0 : _w.primaryColor,
        (_x = profile.brandStyle) === null || _x === void 0 ? void 0 : _x.secondaryColor,
        (_y = profile.brandStyle) === null || _y === void 0 ? void 0 : _y.brandTone,
        (_z = profile.brandStyle) === null || _z === void 0 ? void 0 : _z.packagingStyle,
        // Social Media (weight: 5%)
        (_0 = profile.socialMedia) === null || _0 === void 0 ? void 0 : _0.instagram,
        (_1 = profile.socialMedia) === null || _1 === void 0 ? void 0 : _1.facebook,
        (_2 = profile.socialMedia) === null || _2 === void 0 ? void 0 : _2.linkedin,
        (_3 = profile.socialMedia) === null || _3 === void 0 ? void 0 : _3.twitter,
        (_4 = profile.socialMedia) === null || _4 === void 0 ? void 0 : _4.youtube,
        (_5 = profile.socialMedia) === null || _5 === void 0 ? void 0 : _5.tiktok,
    ];
    const filledFields = allFields.filter(field => {
        if (Array.isArray(field)) {
            return field.length > 0;
        }
        return field !== undefined && field !== null && field !== '';
    }).length;
    return Math.round((filledFields / allFields.length) * 100);
}
