import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  animation?: "fade-up" | "scale-in";
}

/** Fade/scale children in when scrolled into view (IntersectionObserver). */
export function AnimateInView({ children, className, delay = 0, animation = "fade-up" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          ob.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  const hidden =
    animation === "scale-in"
      ? "opacity-0 scale-95"
      : "opacity-0 translate-y-4";

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none",
        shown ? "opacity-100 translate-y-0 scale-100" : hidden,
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
