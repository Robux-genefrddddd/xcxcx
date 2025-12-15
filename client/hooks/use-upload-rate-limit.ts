import { useCallback, useRef } from "react";

const RATE_LIMIT_WINDOW = 10000; // 10 seconds in milliseconds
const MAX_UPLOADS_PER_WINDOW = 1; // 1 upload per window

interface RateLimitState {
  lastUploadTime: number | null;
  uploadCount: number;
}

export function useUploadRateLimit() {
  const rateLimitStateRef = useRef<RateLimitState>({
    lastUploadTime: null,
    uploadCount: 0,
  });

  const canUpload = useCallback((): {
    allowed: boolean;
    waitTimeSeconds: number;
  } => {
    const now = Date.now();
    const state = rateLimitStateRef.current;

    // First upload ever - always allowed
    if (state.lastUploadTime === null) {
      return { allowed: true, waitTimeSeconds: 0 };
    }

    const timeSinceLastUpload = now - state.lastUploadTime;

    // If within the rate limit window
    if (timeSinceLastUpload < RATE_LIMIT_WINDOW) {
      if (state.uploadCount >= MAX_UPLOADS_PER_WINDOW) {
        const waitTime = Math.ceil(
          (RATE_LIMIT_WINDOW - timeSinceLastUpload) / 1000,
        );
        return { allowed: false, waitTimeSeconds: waitTime };
      }
    } else {
      // Window has expired, reset counter
      state.uploadCount = 0;
    }

    return { allowed: true, waitTimeSeconds: 0 };
  }, []);

  const recordUpload = useCallback((): void => {
    const now = Date.now();
    const state = rateLimitStateRef.current;

    // If this is the first upload or window has expired, reset
    if (
      state.lastUploadTime === null ||
      now - state.lastUploadTime >= RATE_LIMIT_WINDOW
    ) {
      state.lastUploadTime = now;
      state.uploadCount = 1;
    } else {
      // Within the window, increment counter
      state.uploadCount += 1;
      state.lastUploadTime = now;
    }
  }, []);

  const reset = useCallback((): void => {
    rateLimitStateRef.current = {
      lastUploadTime: null,
      uploadCount: 0,
    };
  }, []);

  return { canUpload, recordUpload, reset };
}
