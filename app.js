if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
const path = require("path");
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
const mongoose = require("mongoose");
const ejs_mate = require("ejs-mate");
const UserModel = require("./model/user");
const session = require("express-session");
const MongoDbStore = require("connect-mongo");
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/studentDatabase";
const secret = process.env.SECRET || "thisisthegreatone";
const session_config = {
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
  store: MongoDbStore.create({
    mongoUrl: dbUrl,
  }),
};

app.use(session(session_config));
const flash = require("connect-flash");
app.use(flash());
const passport = require("passport");
const localStrategy = require("passport-local");
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(UserModel.authenticate()));
passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());
mongoose.set("useFindAndModify", false);
const mongoSanitize = require("express-mongo-sanitize");
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connection open");
  })
  .catch(() => {
    console.log("connection is rejected", err);
  });
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejs_mate);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejs_mate);
app.use(express.static(path.join(__dirname, "public")));
const collegeRouter = require("./routes/college");
const reviewRouter = require("./routes/reviews");
const userRouter = require("./routes/user");
const ExpressError = require("./utils/ExpressError");
app.use(mongoSanitize());
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});
app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.use("/college", collegeRouter);
app.use("/college/:id/review", reviewRouter);
app.use("/", userRouter);
app.all("*", async (req, res, next) => {
  next(new ExpressError("page is not found", 404));
});

app.use((err, req, res, next) => {
  if (!err.message) {
    err.message = "something went wrong";
  }
  const message = err.message;
  res.render("student/error.ejs", { message });
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on the port ${port}`);
});
