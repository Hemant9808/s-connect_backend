import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { sendEmail } from "../services/emailSevices";

dotenv.config();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

/**
 * User Registration
 */
export const register = async (req: any, res: any) => {
  try {
    console.log("called",req.body)
    const { email, password, role, type } = req.body;
  // console.log(res.body)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || "USER",
        type: type || "STUDENT",
        otp,
        otpExpiry,
      },
    });
    await sendEmail(email, "Verify your account", `Your OTP is: ${otp}`);

    return res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};



export const verifyOtp = async (req: any, res: any) => {
  try {
    const { email, otp } = req.body;
  console.log(email,otp);
  
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP matches and is not expired
    if (user.otp !== otp || !user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP after successful verification
    await prisma.user.update({
      where: { email },
      data: { otp: null, otpExpiry: null },
    });

    return res.status(200).json({ message: "OTP verified successfully. Account activated." });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};


/**
 * User Login
 */
export const login = async (req:any, res:any) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({success:true, message: "Login successful", user,token });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error });
  }
};

/**
 * Get Profile
 */

export const getProfile = async (req: any, res: any) => {
  return res.json((req as any).user);
};

/**
 * Admin-only Access
 */
export const adminAccess = async (req: any, res: any) => {
  return res.json({ message: "Welcome, Admin!" });
};
























// import express, { Request, Response } from "express";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { PrismaClient, UserRole } from "@prisma/client";
// import dotenv from "dotenv";

// dotenv.config();
// const prisma = new PrismaClient();
// const router = express.Router();

// const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"; // Store in .env file

// // Middleware for authentication
// const authenticate = async (req: Request, res: Response, next: Function) => {
//   try {
//     const token = req.header("Authorization")?.replace("Bearer ", "");
//     if (!token) return res.status(401).json({ message: "Unauthorized" });

//     const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: UserRole };
//     const user = await prisma.user.findUnique({ where: { id: decoded.id } });

//     if (!user) return res.status(401).json({ message: "Unauthorized" });

//     req.user = { id: user.id, role: user.role };
//     next();
//   } catch (error) {
//     res.status(401).json({ message: "Invalid token" });
//   }
// };

// // Middleware for role-based access control
// const authorize = (roles: UserRole[]) => {
//   return (req: Request, res: Response, next: Function) => {
//     if (!req.user || !roles.includes(req.user.role)) {
//       return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
//     }
//     next();
//   };
// };

// // **1. User Registration**
// router.post("/register", async (req: any, res: any) => {
//   try {
//     const { email, password, role, type } = req.body;

//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) return res.status(400).json({ message: "User already exists" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await prisma.user.create({
//       data: {
//         email,
//         otp: hashedPassword,
//         role: role || "USER",
//         type,
//       },
//     });

//     res.status(201).json({ message: "User registered successfully", user });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });

// // **2. User Login**
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) return res.status(400).json({ message: "Invalid email or password" });

//     const isMatch = await bcrypt.compare(password, user.otp || "");
//     if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

//     const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });

//     return res.json({ message: "Login successful", token });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });

// // **3. OTP Verification**
// router.post("/verify-otp", async (req: Request, res: Response) => {
//   try {
//     const { email, otp } = req.body;

//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user || user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

//     if (user.otpExpiry && new Date() > new Date(user.otpExpiry)) {
//       return res.status(400).json({ message: "OTP expired" });
//     }

//     await prisma.user.update({
//       where: { email },
//       data: { otp: null, otpExpiry: null },
//     });

//     res.json({ message: "OTP verified successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });

// // **4. Get Profile (Authenticated Route)**
// router.get("/profile", authenticate, async (req: Request, res: Response) => {
//   res.json(req.user);
// });

// // **5. Protected Route (Only for Admins)**
// router.get("/admin", authenticate, authorize(["ADMIN", "SUPER_ADMIN"]), async (req: Request, res: Response) => {
//   res.json({ message: "Welcome, Admin!" });
// });

// export default router;
