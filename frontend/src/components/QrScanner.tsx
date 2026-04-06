"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CameraswitchIcon from "@mui/icons-material/Cameraswitch";

interface QrScannerProps { onScan: (data: string) => void; enabled?: boolean; }

export function QrScanner({ onScan, enabled = true }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastScanRef = useRef<string>("");
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = 0; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  }, []);

  const startScanning = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    let detector: InstanceType<typeof BarcodeDetector> | null = null;
    if ("BarcodeDetector" in window) { try { detector = new BarcodeDetector({ formats: ["qr_code"] }); } catch { detector = null; } }
    const scan = async () => {
      if (!video.videoWidth || !video.videoHeight) { animFrameRef.current = requestAnimationFrame(scan); return; }
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      try {
        if (detector) {
          const barcodes = await detector.detect(canvas);
          for (const b of barcodes) {
            if (b.rawValue && b.rawValue !== lastScanRef.current) { lastScanRef.current = b.rawValue; onScan(b.rawValue); return; }
          }
        }
      } catch { /* ignore */ }
      animFrameRef.current = requestAnimationFrame(scan);
    };
    animFrameRef.current = requestAnimationFrame(scan);
  }, [onScan]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); setCameraActive(true); startScanning(); }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NotAllowed") || msg.includes("Permission")) setError("Permiso de camara denegado.");
      else if (msg.includes("NotFound")) setError("No se encontro una camara.");
      else setError("Error: " + msg);
    }
  }, [facingMode, startScanning]);

  useEffect(() => { return () => stopCamera(); }, [stopCamera]);
  useEffect(() => { if (enabled) { lastScanRef.current = ""; if (cameraActive && !animFrameRef.current) startScanning(); } }, [enabled, cameraActive, startScanning]);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ position: "relative", width: "100%", maxWidth: 500, mx: "auto", aspectRatio: "4/3", bgcolor: "#0F172A", borderRadius: 2, overflow: "hidden", mb: 2 }}>
        <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", display: cameraActive ? "block" : "none" }} playsInline muted />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        {!cameraActive && <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)" }}><VideocamOffIcon sx={{ fontSize: 48, mb: 1 }} /><Typography variant="body2">Camara inactiva</Typography></Box>}
        {cameraActive && <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}><Box sx={{ width: 200, height: 200, border: "3px solid rgba(99,102,241,0.8)", borderRadius: 2, boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)" }} /></Box>}
      </Box>
      <Box display="flex" gap={1} justifyContent="center">
        <Button variant={cameraActive ? "outlined" : "contained"} startIcon={cameraActive ? <VideocamOffIcon /> : <VideocamIcon />} onClick={() => cameraActive ? stopCamera() : startCamera()} disabled={!enabled}>{cameraActive ? "Detener camara" : "Iniciar camara"}</Button>
        {cameraActive && <Button variant="outlined" startIcon={<CameraswitchIcon />} onClick={() => { stopCamera(); setFacingMode(p => p === "environment" ? "user" : "environment"); setTimeout(() => startCamera(), 100); }}>Girar</Button>}
      </Box>
    </Box>
  );
}
