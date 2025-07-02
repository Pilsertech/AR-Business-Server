// src/models/index.js

// Import each model from its respective file
import ArContent from './ArContent.js';
import AdminUser from './AdminUser.js';

// Export both models using NAMED EXPORTS.
// This allows other files to import them using { ArContent } or { AdminUser }.
export {
  ArContent,
  AdminUser,
};