const appError = require("../utils/appError");
const handleCastError = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new appError(message, 400);
};
const handleDuplicate = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate Field value: ${value}.Please Use another Value`;
  return new appError(message, 400);
};
const HandleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid Input Data ${errors.join(". ")}`;
  console.log(message);
  return new appError(message, 400);
};
const handleJWTErr = () =>
  new appError("Invalid Token! Please Login again", 401);
const handleJWTExpire = () =>
  new appError("Your Token Has Expired! Please Login again", 401);

const sendErrDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};
const sendErrProd = (err, res) => {
  //trusted Error Send Message To Client
  if (err.Operational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    //Programming Or Other Unknown Error
    //console.error('Error ', err);
    res.status(500).json({
      status: err.status,
      message: "Something Went Wrong",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrDev(err, res);
  } else {
    let error;
    if (err.name === "CastError") error = handleCastError(err);
    if (err.code === 11000) error = handleDuplicate(err);
    if (err.name === "ValidationError") error = HandleValidationError(err);
    if (err.name === "JsonWebTokenError") error = handleJWTErr();
    if (err.name === "TokenExpiredError") error = handleJWTExpire();

    sendErrProd(error, res);
  }
};
