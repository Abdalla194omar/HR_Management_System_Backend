export const globalError = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  if (req.validationErrors) {
    console.log("req.validationErrors");
    return res.status(statusCode).json({
      message: error.message,
      details: req.validationErrors,

    });
  }

  if (process.env.NODE_ENV === "development") {
    console.log("process.env.NODE_ENV === 'development'");
    return res.status(statusCode).json({
      message: error.message,
      stack: error.stack,
    });
  }

  if (error.isOperational) {
    console.log("operational");
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