// Catches errors passed via next(err) or thrown in async route handlers
// (when wrapped with asyncHandler) and returns a consistent JSON shape.
function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message || "Something went wrong on the server",
  });
}

// Wraps an async route handler so thrown errors reach errorHandler
// instead of crashing the process.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { errorHandler, asyncHandler };
