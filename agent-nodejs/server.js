const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const app = require("./app");
const endpointManager = require("./endpointsmanager");
process.on("uncaughtException", (err) => {
  console.error(err.name, err.message);
  console.error(err);
  console.error("UNHANDLED Exception.. SHUTTING DOWN");
  process.exit(1); //1 MEANS REJECTION
});

const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  console.log(`listening to port ${port}`);
  endpointManager.initializeAgentConfig();
});

process.on("unhandledRejection", (err) => {
  console.error(err.name, err.message);
  console.error("UNHANDLED REJECTION.. SHUTTING DOWN");
  server.close(() => {
    process.exit(1); //1 MEANS REJECTION
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM RECEIVED.. SHUTTING DOWN");
  server.close(() => {
    //Sigterm itself cause the server shutDown
    console.log("Process Terminated");
  });
});
