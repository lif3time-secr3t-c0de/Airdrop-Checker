import rateLimit from "express-rate-limit";

export function createCheckLimiter(maxPerMinute = 30) {
  return rateLimit({
    windowMs: 60_000,
    max: maxPerMinute,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests. Try again in a minute."
    }
  });
}
