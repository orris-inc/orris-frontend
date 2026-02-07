/**
 * Shared form hook for CancelSubscription Dialog/Sheet
 * Manages reason, immediate flag, validation, and submit data building
 */

import { useState } from 'react';

export const useCancelSubscriptionForm = () => {
  const [reason, setReason] = useState('');
  const [immediate, setImmediate] = useState(false);

  const isFormValid = !!reason.trim();

  const buildSubmitData = () => ({
    reason,
    immediate,
  });

  const reset = () => {
    setReason('');
    setImmediate(false);
  };

  return {
    reason,
    setReason,
    immediate,
    setImmediate,
    isFormValid,
    buildSubmitData,
    reset,
  };
};
