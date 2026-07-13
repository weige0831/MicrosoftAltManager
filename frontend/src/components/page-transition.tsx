import { useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { MOTION_TRANSITION, MOTION_VARIANTS } from "@/lib/motion";

/** Wraps children with a fade+blur+translate entrance animation on route change.
 * Adapted from new-api's AnimatedOutlet (TanStack Router -> react-router-dom). */
export function PageTransition({ children }: { children: ReactNode }) {
  const shouldReduce = useReducedMotion();
  const location = useLocation();

  if (shouldReduce) {
    return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
  }

  return (
    <motion.div
      key={location.pathname}
      initial={MOTION_VARIANTS.pageEnter.initial}
      animate={MOTION_VARIANTS.pageEnter.animate}
      transition={MOTION_TRANSITION.fast}
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
