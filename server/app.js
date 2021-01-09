const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const axios = require("axios");
require("dotenv").config();

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.CLIENT_ID);

const app = express();
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:8000", credentials: true }));
app.use(passport.initialize({ session: false }));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:4000/auth/google/callback",
      passReqToCallback: true,
    },
    (req, accessToken, refreshToken, profile, cb) => {
      req.refreshToken = refreshToken;
      return cb(null, { name: "someUser" });
    }
  )
);

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile"],
    accessType: "offline",
    prompt: "consent",
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    res.cookie("refreshToken", req.refreshToken, { httpOnly: true });
    res.redirect("http://localhost:8000");
  }
);

app.get("/auth/google/refresh", (req, res) => {
  res.sendStatus(200);
});

app.get("/auth/google/logout", (req, res) => {
  res.clearCookie("refreshToken");
  res.redirect("http://localhost:8000");
});

app.get("/getJwt", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    const { data } = await axios.post(
      "https://www.googleapis.com/oauth2/v4/token",
      {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }
    );
    const { id_token: jwt } = data;
    res.json({ jwt });
  } catch (e) {
    res.sendStatus(401);
  }
});

app.use(async (req, res) => {
  const { authorization } = req.headers;
  const [, idToken] = authorization.split(" ");
  try {
    await client.verifyIdToken({
      idToken,
      audience: process.env.CLIENT_ID,
    });
    req.next();
  } catch (e) {
    res.sendStatus(401);
  }
});

app.get("/protectedRoute", (req, res) => {
  res.sendStatus(200);
});

app.listen(4000);
