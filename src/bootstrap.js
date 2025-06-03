import connection from "../DB/connection.js";
import cors from "cors";
import path from "path";
import { globalError } from "./middleWare/globalError.js";

const initializeApp = (app, express) => {
  app.use(cors());
  app.use(express.json());
  connection();

  app.use(globalError);
  
};

export default initializeApp;
