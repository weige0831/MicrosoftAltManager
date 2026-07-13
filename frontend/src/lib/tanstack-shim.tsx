import {
  Link as RRLink,
  useNavigate as useRRNavigate,
  useLocation as useRRLocation,
  Outlet,
  useParams as rrParams,
} from "react-router-dom";
import { forwardRef } from "react";

export { Outlet };

export type LinkProps = {
  to: string | { to?: string; pathname?: string; search?: string | Record<string, unknown> };
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler;
  target?: string;
  rel?: string;
  "aria-label"?: string;
  replace?: boolean;
};

function resolveTo(to: LinkProps["to"]): string {
  if (typeof to === "string") return to;
  if (!to || typeof to !== "object") return "/";
  if (typeof to.to === "string") return to.to;
  const path = typeof to.pathname === "string" ? to.pathname : "/";
  if (!to.search) return path;
  if (typeof to.search === "string") {
    return path + (to.search.startsWith("?") ? to.search : `?${to.search}`);
  }
  const qs = new URLSearchParams();
  Object.entries(to.search).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, children, ...rest },
  ref,
) {
  return (
    <RRLink ref={ref} to={resolveTo(to)} {...rest}>
      {children}
    </RRLink>
  );
});

export function useNavigate() {
  const nav = useRRNavigate();
  return (opts: any) => {
    if (typeof opts === "number") return nav(opts);
    if (typeof opts === "string") return nav(opts);
    if (opts && typeof opts === "object") {
      const path = resolveTo(opts.to ?? opts);
      const replace = !!opts.replace;
      return nav(path, { replace });
    }
    return nav("/");
  };
}

export function useLocation(opts?: { select?: (l: any) => any }) {
  const loc = useRRLocation();
  const enriched = {
    ...loc,
    href: loc.pathname + loc.search + loc.hash,
    pathname: loc.pathname,
    search: loc.search,
    hash: loc.hash,
  };
  return opts?.select ? opts.select(enriched) : enriched;
}

export function useParams<T = any>(): T {
  return rrParams() as T;
}

export function useRouterState(opts?: { select?: (s: any) => any }) {
  const loc = useLocation();
  const state = {
    location: { pathname: loc.pathname, href: loc.href, search: loc.search },
    matches: [{ routeId: loc.pathname }],
  };
  return opts?.select ? opts.select(state) : (state as any);
}

export function useSearch(): Record<string, any> {
  const loc = useRRLocation();
  const r: Record<string, any> = {};
  new URLSearchParams(loc.search).forEach((v, k) => {
    r[k] = v;
  });
  return r;
}

export function redirect(opts: { to: string; search?: any }) {
  return { type: "redirect", ...opts };
}
export function useRouter() {
  return { navigate: useNavigate() };
}
export function createRootRouteWithContext<T>(_ctx: T) {
  return (o: any) => o;
}
export function createRouter(o: any) {
  return o;
}
export function RouterProvider(_p: any) {
  return null;
}
export function useBlocker() {
  return { reset: () => {}, proceed: () => {}, location: { pathname: "/" } };
}
export function getRouteApi(_o: any) {
  return {
    useSearch: () => ({}),
    useNavigate: () => () => {},
    useLoaderData: () => ({}),
  };
}
export function useLoaderData() {
  return {};
}
export function notFound(o?: any) {
  return o || {};
}
export function createFileRoute(_p: string) {
  return (o: any) => o;
}
export function createLazyFileRoute(_p: string) {
  return (o: any) => o;
}
export function useMatch(_o?: any) {
  return { params: {}, pathname: "/" };
}
export function useMatches() {
  return [];
}
export function useMatchRoute() {
  return () => false;
}
export function useCanGoBack() {
  return false;
}
export function useChildMatches() {
  return [];
}
export function useParentMatches() {
  return [];
}
export function useRouteContext() {
  return {};
}
export function lazyFn(fn: any) {
  return fn;
}
export function lazyRouteComponent(c: any) {
  return c;
}
