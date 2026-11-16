/**
 * What each role may do.
 *
 * Every account of the pretend server has a role: `eva` is an `admin`, `jan` an `editor`, `petra` a
 * `viewer`. A permission is the name of a thing and what may be done with it: `orders.view`,
 * `orders.edit`, `orders.delete`. `*` is everything, `orders.*` everything with the orders.
 *
 * The pretend server has the same table (`GRD_DEMO_PERMISSIONS` of the library) and checks every
 * request by it, so the browser and the server agree.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  editor: ['orders.*', 'reports.view'],
  viewer: ['orders.view', 'reports.view'],
};
