const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();

const dbPath = path.join(__dirname, "userData.db");
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Register user API
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectPasswordQuery = `SELECT * FROM user WHERE password = '${password}'`;
    const dbPassword = await db.get(selectPasswordQuery);
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  }
});

//login user API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("Invalid User");
  } else if (dbUser === undefined) {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

//change-password API
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const selectPasswordQuery = `SELECT * FROM user WHERE password = '${newPassword}'`;
  const dbPassword = await db.get(selectPasswordQuery);
  if (dbPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      newPassword,
      dbPassword.newPassword
    );
    if (isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid current password");
    } else {
      response.status(200);
      response.send("Password updated");
    }
  }
});

module.exports = app;
