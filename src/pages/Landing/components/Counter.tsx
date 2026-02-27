import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";

interface CounterProps {
  end: number;
  suffix: string;
}

export function Counter({ end, suffix }: CounterProps) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const run = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 2000, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [inView, end]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}
