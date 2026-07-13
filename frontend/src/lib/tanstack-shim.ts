import { Link, useNavigate, useLocation, Outlet, useParams as rrParams } from "react-router-dom";

export { Link, useNavigate, Outlet, useLocation };

export function useParams<T = any>(): T { return rrParams() as T; }

export function useRouterState(opts?: { select?: (s: any) => any }) {
  const loc = useLocation();
  const state = { location: { pathname: loc.pathname, href: loc.pathname + loc.search }, matches: [{ routeId: loc.pathname }] };
  return opts?.select ? opts.select(state) : state as any;
}

export function useSearch(): Record<string, any> {
  const loc = useLocation();
  const r: Record<string, any> = {};
  new URLSearchParams(loc.search).forEach((v, k) => { r[k] = v; });
  return r;
}

export function redirect(opts: { to: string; search?: any }) { return { type: "redirect", ...opts }; }
export function useRouter() { return { navigate: useNavigate() }; }
export function createRootRouteWithContext<T>(_ctx: T) { return (o: any) => o; }
export function createRouter(o: any) { return o; }
export function RouterProvider(_p: any) { return null; }
export function useBlocker() { return { reset: () => {}, proceed: () => {}, location: { pathname: "/" } }; }
export function getRouteApi(_o: any) { return { useSearch: () => ({}), useNavigate: () => () => {}, useLoaderData: () => ({}) }; }
export function useLoaderData() { return {}; }
export function notFound(o?: any) { return o || {}; }
export function createFileRoute(_p: string) { return (o: any) => o; }
export function createLazyFileRoute(_p: string) { return (o: any) => o; }
export function useMatch(_o?: any) { return { params: {}, pathname: "/" }; }
export function useMatches() { return []; }
export function useMatchRoute() { return () => false; }
export function useCanGoBack() { return false; }
export function useChildMatches() { return []; }
export function useParentMatches() { return []; }
export function useRouteContext() { return {}; }
export function lazyFn(fn: any) { return fn; }
export function lazyRouteComponent(c: any) { return c; }
