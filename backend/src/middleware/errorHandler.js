function errorHandler(error, _request, response, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error.';

  if (error.name === 'MulterError') {
    statusCode = 400;
    message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Image size exceeds the 8 MB limit.'
      : 'Invalid image upload.';
  }

  response.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = {
  errorHandler,
};
