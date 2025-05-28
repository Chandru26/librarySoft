/**
 * @file tiers.js
 * @description Defines subscription tiers and their properties for the application.
 */

const TIERS = Object.freeze({
  FREE: Object.freeze({
    name: 'Free',
    bookLimit: 100,
    userLimit: 3,
  }),
  BASIC: Object.freeze({
    name: 'Basic',
    bookLimit: 1000,
    userLimit: 10,
  }),
  PREMIUM: Object.freeze({
    name: 'Premium',
    bookLimit: -1, // -1 indicates unlimited
    userLimit: -1,  // -1 indicates unlimited
  }),
});

const DEFAULT_TIER = TIERS.FREE;

// Function to get tier details by name (optional, but can be useful)
function getTierByName(tierName) {
  return Object.values(TIERS).find(tier => tier.name === tierName) || null;
}

module.exports = {
  TIERS,
  DEFAULT_TIER,
  getTierByName,
};

// Example Usage (illustrative, not part of this file's execution)
// const { TIERS, DEFAULT_TIER } = require('./tiers');
// console.log(DEFAULT_TIER.name); // Output: Free
// console.log(TIERS.PREMIUM.bookLimit); // Output: -1
