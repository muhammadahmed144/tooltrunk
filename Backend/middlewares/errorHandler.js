import { ApiError } from '../utils/apiError.js';

export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error.';
  let errors = err.errors || [];

  // Handle Payload Too Large
  if (err.status === 413 || err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Payload too large. Please upload a file smaller than 10MB.';
  }

  // Handle SyntaxError (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload.';
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction && statusCode === 500) {
    console.error('[ServerError]', err);
  }

  return res.status(statusCode).json({
    success: false,
    error: message,
    message,
    ...(errors.length > 0 && { errors }),
    ...(!isProduction && statusCode === 500 && { stack: err.stack }),
  });
}
