"use strict";

const assert = require("assert");

assert(
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "production",
    "You must set the NODE_ENV variable to development or production"
);
var express = require("express");
var mongoose = require("mongoose");
mongoose.set("strictQuery", true);

var fs = require("fs");

// Setup server
var app = express();
var expressUtils = require("./utils/express");
expressUtils.loadExpressConfig(app);

var server = require("http").createServer(app);

module.exports = app;