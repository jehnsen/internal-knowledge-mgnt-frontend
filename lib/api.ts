// Backward-compatibility barrel.
// The implementation has been split into lib/api/<domain>.ts modules.
// All existing `import … from "@/lib/api"` imports continue to work unchanged.
export * from './api/index';
