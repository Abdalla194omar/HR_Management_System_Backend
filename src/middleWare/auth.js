import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler.js"; 

exports.auth = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("You are not logged in! Please log in to get access.", 401));
  }

  try {
    const decoded = jwt.verify(token, "secret123");
    req.user = decoded; 
    next();
  } catch (err) {
    return next(new AppError("Invalid token or session expired", 401));
  }
};

exports.protect = exports.auth; 

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
};