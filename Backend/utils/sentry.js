import * as Sentry from '@sentry/node';

let isSentryEnabled = false;

export function initSentry(app) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || dsn.includes('your_sentry_dsn')) {
    return {
      requestHandler: (req, res, next) => next(),
      errorHandler: (err, req, res, next) => next(err),
    };
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0,
      beforeSend(event) {
        // Redact any sensitive passwords or tokens before sending to Sentry
        if (event.request && event.request.data) {
          if (typeof event.request.data === 'object') {
            if (event.request.data.password) event.request.data.password = '[REDACTED]';
            if (event.request.data.token) event.request.data.token = '[REDACTED]';
          }
        }
        return event;
      },
    });

    isSentryEnabled = true;
    console.log('✅ Sentry monitoring initialized successfully');

    return {
      requestHandler: Sentry.Handlers.requestHandler(),
      errorHandler: Sentry.Handlers.errorHandler(),
    };
  } catch (err) {
    console.warn('⚠️ Sentry failed to initialize:', err.message);
    return {
      requestHandler: (req, res, next) => next(),
      errorHandler: (err, req, res, next) => next(err),
    };
  }
}

export function captureException(error, context = {}) {
  if (isSentryEnabled) {
    Sentry.captureException(error, { extra: context });
  }
}
