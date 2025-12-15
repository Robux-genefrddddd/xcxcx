import { Router, Request, Response } from "express";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const router = Router();

// Initialize Firebase Admin SDK
let initialized = false;

function initializeFirebaseAdmin() {
  if (initialized) return;

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!serviceAccountKey || !storageBucket) {
    throw new Error("Missing Firebase credentials");
  }

  const serviceAccount = JSON.parse(serviceAccountKey);

  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: storageBucket,
  });

  initialized = true;
}

router.get("/share-download/:fileId", async (req: Request, res: Response) => {
  try {
    initializeFirebaseAdmin();

    const { fileId } = req.params;
    const { password } = req.query;

    if (!fileId) {
      return res.status(400).json({ error: "File ID is required" });
    }

    console.log("Share download request - fileId:", fileId);

    // For client-side Firestore access, we need to use fetch
    const firebaseStorageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    const firebaseProjectId = "keysystem-d0b86-8df89";

    // Fetch file metadata from Firestore
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/files/${fileId}`;

    console.log("Fetching file metadata from Firestore...");

    const metadataResponse = await fetch(firestoreUrl);

    if (!metadataResponse.ok) {
      return res.status(404).json({ error: "File not found" });
    }

    const metadataJson = await metadataResponse.json();
    const fields = metadataJson.fields;

    // Extract file data from Firestore response
    const shared = fields.shared?.booleanValue || false;
    const sharePassword = fields.sharePassword?.stringValue || null;
    const storagePath = fields.storagePath?.stringValue;
    const fileName = fields.name?.stringValue || "download";

    if (!shared) {
      return res.status(403).json({ error: "This file is not shared" });
    }

    // Check password if file is password protected
    if (sharePassword) {
      if (!password || password !== sharePassword) {
        return res.status(401).json({ error: "Incorrect or missing password" });
      }
    }

    if (!storagePath) {
      return res.status(500).json({ error: "File storage path not found" });
    }

    console.log("File metadata retrieved, fetching from storage...");

    const encodedPath = encodeURIComponent(storagePath);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseStorageBucket}/o/${encodedPath}?alt=media`;

    const fileResponse = await fetch(downloadUrl);

    if (!fileResponse.ok) {
      return res.status(fileResponse.status).json({
        error: `Firebase Storage error: ${fileResponse.statusText}`,
      });
    }

    const contentType =
      fileResponse.headers.get("content-type") || "application/octet-stream";
    const contentLength = fileResponse.headers.get("content-length");

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`,
    );

    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const buffer = await fileResponse.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Share download error:", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({ error: `Download failed: ${errorMsg}` });
  }
});

export { router as shareDownloadRouter };
