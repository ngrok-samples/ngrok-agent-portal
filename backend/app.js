const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const compression = require("compression");
const cors = require("cors");
const globalError = require("./controllers/errorController");
//const addMorganMiddleware = require("./utils/morgan-middleware");
const morganBody = require('morgan-body');

const agentRoutes = require("./routes/agent");
const endpointRoutes = require("./routes/agentEndpoints");

const app = express();
app.enable("trust proxy");
//Global Middleware Stack

//implementing CORS
app.use(cors());
app.options("*", cors());

//static File
app.use(express.static(`${__dirname}/public`));

//Allowing Only 100 Request in 1 Hour For '/api'
const limit = rateLimit({
  max: 500,
  windowMs: 60 * 60 * 1000,
  message: "Too Many Request From this IP.",
});
app.use("/api", limit);

//body parse middleware
app.use(
  express.json({
    //limit: '10kb',
  })
);
//seting View Engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
//Data Sanitization against No Sql query injection(Filtering $ etc)
app.use(mongoSanitize());
//Data Sanitization against XSS
app.use(xss());
//Prevent Parameter Pollution
//app.use(hpp({whitelist:['id']}))

//Compressing text
app.use(compression());

//static File
//app.use(express.static(`${__dirname}/public`));

//logging
//addMorganMiddleware(app);
morganBody(app, {maxBodyLength: 20000, logReqUserAgent: false, logReqDateTime: false});

//Routes Middleware
app.get("/api/v1/test", (req, res) => {
  res.status(200).json({
    status: "Test Backend Success",
  });
});
app.use("/api/v1/agent", agentRoutes);
app.use("/api/v1/endpoint", endpointRoutes);
app.use(globalError);

app.use(function (request, response, next) {
  if (process.env.NODE_ENV != "development" && !request.secure) {
    return response.redirect("https://" + request.headers.host + request.url);
  }

  next();
});
// if (process.env.NODE_ENV == 'production') {
//   app.use(express.static('client/build'));
//   const path = require('path');
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
//   });
// }
app.all("*", (req, res, next) => {
  next(
    new AppError(
      `requested Url ${req.originalUrl} could not be found on this server`,
      404
    )
  );
});

module.exports = app;
