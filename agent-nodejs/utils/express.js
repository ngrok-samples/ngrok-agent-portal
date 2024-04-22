/**
 * Express configuration
 */

"use strict";

const express = require("express");
const favicon = require("serve-favicon");
const compression = require("compression");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const errorHandler = require("errorhandler");
const path = require("path");
const expressWinston = require("express-winston");
const logger = require("./logger");
//const addMorganMiddleware = require("./utils/morgan-middleware");
const morganBody = require('morgan-body');
const xss = require("xss-clean");
const globalError = require("../controllers/errorController");
const agentRoutes = require("../routes/agentEndpoints");

var loadExpressConfig = function (app) {
    var env = app.get("env");

    app.set("logger", logger);

    //addMorganMiddleware(app);
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    morganBody(app, {maxBodyLength: 20000, logReqUserAgent: false, logReqDateTime: false});
      
    app.enable("trust proxy");
    app.use(compression());
    app.use(methodOverride());
    app.use(cookieParser());

    var cors = require("cors");
    app.use(cors());
    app.options("*", cors());

    if ("production" === env) {
        app.use(favicon(path.join(envConfig.root, "public", "favicon.ico")));
        app.use(express.static(path.join(envConfig.root, "public")));
        app.set("appPath", envConfig.root + "/public");
    }

    const AppError = require("./appError");

    app.use(express.static(`${__dirname}/public`));

    //body parse middleware
    app.use(
        express.json({
            //limit: '10kb',
        })
    );
    //setting View Engine
    app.set("view engine", "pug");
    app.set("views", path.join(__dirname, "views"));
    //Data Sanitization against XSS
    app.use(xss());
    //Prevent Parameter Pollution
    //app.use(hpp({whitelist:['id']}))
    
    //Compressing text
    app.use(compression());
    
    //Routes Middleware
    app.get("/api/v1/test", (req, res) => {
        res.status(200).json({
            status: "Test Backend Success",
        });
    });
    app.use("", agentRoutes);
    
    app.use(globalError);
    
    app.use(function (request, response, next) {
        if (process.env.NODE_ENV != "development" && !request.secure) {
            return response.redirect("https://" + request.headers.host + request.url);
        }
    
        next();
    });
    app.all("*", (req, res, next) => {
        next(
            new AppError(
                `requested Url ${req.originalUrl} could not be found on this server`,
                404
            )
        );
    });
    app.use(errorHandler()); // Error handler - has to be last
};

module.exports = {
    loadExpressConfig: loadExpressConfig,
};