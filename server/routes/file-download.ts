import { Router, Request, Response } from "express";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";

const router = Router();

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAZz5Hq6BzZlqKVWdKCL5TA_BhXXBJCWh4",
  authDomain: "keysystem-d0b86-8df89.firebaseapp.com",
  projectId: "keysystem-d0b86-8df89",
  storageBucket: "keysystem-d0b86-8df89.appspot.com",
  messagingSenderId: "1048409565735",
  appId: "1:1048409565735:web:e49b45fa5e2b5e4a7a94dd",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

router.post("/download", async (req: Request, res: Response) => {
  try {
    const { storagePath } = req.body;

    if (!storagePath) {
      return res.status(400).json({ error: "Storage path is required" });
    }

    try {
      const fileRef = ref(storage, storagePath);
      const downloadUrl = await getDownloadURL(fileRef);

      const MAX_RETRIES = 3;
      const INITIAL_DELAY = 1000;

      const downloadWithRetry = async (retryCount = 0): Promise<Response> => {
        try {
          const response = await fetch(downloadUrl);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return response;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);

          if (
            (errorMsg.includes("network") || errorMsg.includes("timeout")) &&
            retryCount < MAX_RETRIES
          ) {
            const delay = INITIAL_DELAY * Math.pow(2, retryCount);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return downloadWithRetry(retryCount + 1);
          }

          throw error;
        }
      };

      const response = await downloadWithRetry();
      const buffer = await response.arrayBuffer();

      res.set("Content-Type", "application/octet-stream");
      res.set("Content-Length", String(buffer.byteLength));
      res.set("Content-Disposition", "attachment");
      res.send(Buffer.from(buffer));
    } catch (firebaseError) {
      const errorMsg = firebaseError instanceof Error ? firebaseError.message : String(firebaseError);

      if (errorMsg.includes("object-not-found")) {
        return res.status(404).json({ error: "File not found" });
      }

      throw firebaseError;
    }
  } catch (error) {
    console.error("File download error:", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({ error: `Download failed: ${errorMsg}` });
  }
});

export { router as fileDownloadRouter };
