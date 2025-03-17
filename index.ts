// src/index.ts
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
// import authRoutes from "./controllers/authController";
import authRoutes from "./routes/authRoutes";
import groupRoutes from "./routes/groupRoutes";
import eventRoutes from "./routes/eventRoutes";
import cors from "cors";
dotenv.config();
import multer from 'multer';
import cloudinary from 'cloudinary';
import { v2 as cloudinaryV2 } from 'cloudinary';
import { uploadOnCloudinary } from "./utils/upload";


const app: Express = express();
app.use(cors());
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.use("/api/auth", authRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/event",eventRoutes );
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const upload = multer({ dest: 'uploads/' }); 



const uploadImage = async (req, res) => {
  try {
    const coverImageLocalPath = req.file?.path;
    console.log("coverImageLocalPath", coverImageLocalPath);
  
    if (!coverImageLocalPath) {
      res.send({message:"coverImageLocalPath not found"})    }
  
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   
    if(coverImage==null){return res.send({message:"coverImage is null "})}
    if (!coverImage.url) {
      return res.send({message:"cover.url not found"})
    }
    console.log("coverImage", coverImage);
    return res.send({coverImage: coverImage.url});

    return res.status(200).json(coverImage.url);
  } catch (error) {
    console.log(error); 
    res.send(error.message)
  }
 
};

app.post("/upload-image" ,upload.single("file"), uploadImage)

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    // Upload image to Cloudinary
    const result = await cloudinaryV2.uploader.upload((req as any).file.path);
    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
  }
);



app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
