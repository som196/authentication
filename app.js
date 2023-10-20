const express = require("express");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
module.exports = app;
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: '${e.message}'`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API1 If the username already exists, If the registrant provides a password with less than 5 characters
//Successful registration of the registrant
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 12);
  const selectUserQuery = `SELECT * FROM user
    WHERE username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `INSERT INTO USER (username,name,password,gender,location)
        VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(createUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API2 If an unregistered user tries to login, If the user provides incorrect password
//Successful login of the user
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUser = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(getUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const doesPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (doesPasswordMatch === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUser = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(getUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const doesPasswordMatch = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (doesPasswordMatch === true && newPassword.length >= 5) {
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      const newQuery = `UPDATE user set password='${hashedNewPassword}'
      WHERE username='${username}';`;
      await db.run(newQuery);
      response.send("Password updated");
    } else if (doesPasswordMatch === false) {
      response.status(400);
      response.send("Invalid current password");
    } else if (doesPasswordMatch === true && newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    }
  }
});
