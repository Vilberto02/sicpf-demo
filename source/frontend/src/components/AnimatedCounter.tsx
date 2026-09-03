import { useEffect, useState, memo } from "react";

function AnimatedCounterInner({ 
  value, 
  isFloat = false, 
  suffix = "" 
}: { 
  value: number, 
  isFloat?: boolean, 
  suffix?: string 
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1200; // ms
    const startTime = performance.now();
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(value * easeProgress);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value]);

  return <>{isFloat ? count.toFixed(2) : Math.floor(count)}{suffix}</>;
}

export const AnimatedCounter = memo(AnimatedCounterInner);
