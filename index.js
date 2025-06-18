import express from "express";
import dotenv from "dotenv";
import initializeApp from "./src/bootstrap.js";

dotenv.config({ path: "./config/.env" });

const port = process.env.PORT || 5000;
const app = express();
initializeApp(app, express);


app.listen(port, () => {
  console.log(`Server running successfully on port ${port}`);
});