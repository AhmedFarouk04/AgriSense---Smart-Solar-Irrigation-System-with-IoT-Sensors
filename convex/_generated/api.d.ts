/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as email from "../email.js";
import type * as events from "../events.js";
import type * as exports from "../exports.js";
import type * as http from "../http.js";
import type * as password from "../password.js";
import type * as passwordMutations from "../passwordMutations.js";
import type * as plants from "../plants.js";
import type * as readings from "../readings.js";
import type * as seedData from "../seedData.js";
import type * as settings from "../settings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  email: typeof email;
  events: typeof events;
  exports: typeof exports;
  http: typeof http;
  password: typeof password;
  passwordMutations: typeof passwordMutations;
  plants: typeof plants;
  readings: typeof readings;
  seedData: typeof seedData;
  settings: typeof settings;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
