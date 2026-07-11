function notFound(req, res, next) { next(new Error(`Route not found`)); }
function errorHandler(err, req, res, next) {
  res.status(500).json({ success: false, message: err.message });
}
module.exports = { notFound, errorHandler };