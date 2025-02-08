import nodemailer from "nodemailer";
import path from "path";
import dotenv from "dotenv";
import { text } from "stream/consumers";



dotenv.config();




export const sendEmail = async (to: string, subject: string, text: string) => {
  

 

  // const pdfBuffer = await generateBookingPdf(processedBookingData);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "hemant@adirayglobal.com",
      pass: "ogmnatcklinhjoyl",
    },
  });





  const mailOptions = {
    from: "hemant27134@gmail.com",
    to:"hemant27134@gmail.com",
    // bcc: "hemant27134@gmail.com",
    // to,
    subject,
    text,
  };
  await transporter.sendMail(mailOptions);
};
