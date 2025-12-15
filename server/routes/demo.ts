import { RequestHandler } from "express";
import { DemoResponse } from "@shared/api";

export const handleDemo: RequestHandler = (req, res) => {
  const response: DemoResponse = {
    message: "Welcome to PinPinCloud - Secure file sharing at your fingertips",
  };
  res.status(200).json(response);
};
