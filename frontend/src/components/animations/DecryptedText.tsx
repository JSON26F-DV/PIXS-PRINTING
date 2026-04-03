import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface DecryptedTextProps extends HTMLMotionProps<"span"> {
  text: string;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  className?: string;
  parentClassName?: string;
  animateOn?: 'hover' | 'view';
}

const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 50,
  maxIterations = 10,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+',
  className = '',
  parentClassName = '',
  animateOn = 'hover',
  ...props
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    let iteration = 0;
    const originalText = text.split('');
    
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      const newText = originalText.map((char) => {
        if (char === ' ') return ' ';
        // Logic fix: iteration > maxIterations means we should return the real char
        return characters[Math.floor(Math.random() * characters.length)];
      }).join('');

      setDisplayText(newText);
      iteration++;

      if (iteration > maxIterations) {
        setDisplayText(text);
        setIsAnimating(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, speed);
  }, [isAnimating, text, maxIterations, characters, speed]);

  useEffect(() => {
    if (animateOn === 'view') {
      triggerAnimation();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [animateOn, triggerAnimation]);

  return (
    <motion.span
      className={parentClassName}
      onMouseEnter={() => animateOn === 'hover' && triggerAnimation()}
      {...props}
    >
      <span className={className}>{displayText}</span>
    </motion.span>
  );
};

export default DecryptedText;
