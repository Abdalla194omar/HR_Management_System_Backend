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

  if (error.isOperational) {
    return res.status(statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  console.error("UNEXPECTED ERROR :", error);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
};
