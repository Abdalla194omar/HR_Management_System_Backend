export const globalError = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  if (req.validationresult?.details) {
    return res.status(statusCode).json({
      message: error.message,
      details: req.validationresult.details,
    });
  }

  if (process.env.NODE_ENV === "development") {
    return res.status(statusCode).json({
      message: error.message,
      stack: error.stack,
    });
  }

  if (err.isOperational) {
    return res.status(statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  console.error("UNEXPECTED ERROR :", err);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
};
