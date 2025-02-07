// src/index.ts
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
// import authRoutes from "./controllers/authController";
import authRoutes from './routes/authRoutes'
import cors from 'cors'
dotenv.config();

const app: Express = express();
app.use(cors());
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");

});





app.use("/api/auth", authRoutes);



app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

