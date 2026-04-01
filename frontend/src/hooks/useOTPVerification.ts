import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

/**
 * Industrial OTP Verification Logic Hub.
 * Simulates enterprise-grade 2FA with retry protection and locking mechanisms.
 */
export const useOTPVerification = () => {
  const [step, setStep] = useState<'method' | 'otp' | 'verified'>('method');
  const [method, setMethod] = useState<'email' | 'sms' | null>(null);
  const [generatedOTP, setGeneratedOTP] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const MAX_ATTEMPTS = 3;

  const sendCode = useCallback((targetMethod: 'email' | 'sms') => {
    if (isLocked) {
      toast.error('Protocol Locked: Too many failed terminal attempts.');
      return;
    }

    setMethod(targetMethod);
    // Simulate generation of 6-digit secure node sequence
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(code);
    setStep('otp');
    
    // In production, this would trigger the PHPMailer or SMS Gateway
    console.log(`[SECURITY PROTOCOL] OTP generated for ${targetMethod}: ${code}`);
    toast.success('Security code dispatched to your chosen terminal.');
  }, [isLocked]);

  const verifyOTP = useCallback((inputOTP: string) => {
    if (isLocked) return false;

    if (inputOTP === generatedOTP) {
      setStep('verified');
      toast.success('Identity node verified. Secure access granted.');
      return true;
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        toast.error('CRITICAL: Terminal locked due to multiple invalid nodes.');
        // Auto-unlock after 30 seconds for simulation
        lockTimerRef.current = setTimeout(() => {
          setIsLocked(false);
          setAttempts(0);
        }, 30000);
      } else {
        toast.error(`Invalid node sequence. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
      }
      return false;
    }
  }, [generatedOTP, attempts, isLocked]);

  const resetVerification = useCallback(() => {
    setStep('method');
    setMethod(null);
    setGeneratedOTP(null);
    setAttempts(0);
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
  }, []);

  return {
    step,
    method,
    isLocked,
    attemptsRemaining: MAX_ATTEMPTS - attempts,
    sendCode,
    verifyOTP,
    resetVerification
  };
};
