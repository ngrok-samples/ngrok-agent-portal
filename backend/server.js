const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const app = require("./app");

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log(err);
  console.log("UNHANDLED Exception.. SHUTTING DOWN");
  process.exit(1); //1 MEANS REJECTION
});
//app.use(bodyParser.urlencoded({ extended: false }))
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

//mongoose.connect(process.env.LOCAL_DB,...)

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("DB connection Success");
  })
  .catch((err) => console.log(err));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`listening to port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION.. SHUTTING DOWN");
  server.close(() => {
    //wew r giving server a time to finish it process that are still pending
    process.exit(1); //1 MEANS REJECTION
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM RECIEVED.. SHUTTING DOWN");
  server.close(() => {
    //Sigterm itself cause the server shutDown
    console.log("Process Terminated");
  });
});
