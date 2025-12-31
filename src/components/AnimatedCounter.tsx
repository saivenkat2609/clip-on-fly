import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}

/**
 * AnimatedCounter component
 *
 * Smoothly animates number changes with spring physics
 *
 * @example
 * <AnimatedCounter value={1234} duration={1} suffix=" credits" />
 * <AnimatedCounter value={42.5} decimals={1} prefix="$" />
 */
export function AnimatedCounter({
  value,
  duration = 1,
  className = '',
  decimals = 0,
  suffix = '',
  prefix = ''
}: AnimatedCounterProps) {
  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0
  });

  const display = useTransform(spring, (current) => {
    const rounded = decimals > 0
      ? current.toFixed(decimals)
      : Math.round(current).toString();

    const formatted = Number(rounded).toLocaleString();
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
