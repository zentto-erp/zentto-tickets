"use client";
import React, { useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import WarningIcon from "@mui/icons-material/Warning";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import { api } from "@/lib/api";
import { QrScanner } from "@/components/QrScanner";

interface STI { EventName: string; EventDate: string; BuyerName: string; SectionName: string; RowLabel: string; SeatNumber: number; VenueName: string; }
interface SR { valid: boolean; error?: string; ticket?: STI; scannedAt?: string; }
type SS = "idle" | "scanning" | "valid" | "invalid" | "already_scanned";

export default function ScanPage() {
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState<SR | null>(null);
  const [scanState, setScanState] = useState<SS>("idle");
  const [loading, setLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [scanCount, setScanCount] = useState(0);

  const validate = useCallback(async (code: string) => {
    if (!code.trim() || loading) return;
    setLoading(true); setResult(null); setScanState("scanning");
    try {
      const res = await api.post<SR>("/v1/scan/validate", { barcode: code.trim() });
      setResult(res);
      if (res.valid) { setScanState("valid"); setScanCount((c) => c + 1); }
      else if (res.error === "already_scanned") setScanState("already_scanned");
      else setScanState("invalid");
    } catch (err) { setResult({ valid: false, error: String(err) }); setScanState("invalid"); }
    setLoading(false);
  }, [loading]);

  const reset = () => { setResult(null); setBarcode(""); setScanState("idle"); };
  const col = scanState === "valid" ? "#10B981" : scanState === "already_scanned" ? "#F59E0B" : scanState === "invalid" ? "#EF4444" : "transparent";
  const icon = scanState === "valid" ? <CheckCircleIcon sx={{ fontSize: 56, color: "#10B981" }} /> : scanState === "already_scanned" ? <WarningIcon sx={{ fontSize: 56, color: "#F59E0B" }} /> : scanState === "invalid" ? <CancelIcon sx={{ fontSize: 56, color: "#EF4444" }} /> : null;
  const label = scanState === "valid" ? "VALIDO" : scanState === "already_scanned" ? "YA ESCANEADO" : scanState === "invalid" ? "INVALIDO" : "";

  return (
    <Box px={4} py={4} maxWidth={600} mx="auto">
      <Stack alignItems="center" mb={3}>
        <QrCodeScannerIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
        <Typography variant="h4" fontWeight={700}>Scanner de Boletos</Typography>
        <Typography variant="body2" color="text.secondary">Valida boletos en puerta escaneando el codigo QR</Typography>
        {scanCount > 0 && <Chip label={`${scanCount} escaneado${scanCount > 1 ? "s" : ""} esta sesion`} size="small" color="primary" variant="outlined" sx={{ mt: 1 }} />}
      </Stack>
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabIndex} onChange={(_, v) => { setTabIndex(v); reset(); }} variant="fullWidth">
          <Tab icon={<QrCodeScannerIcon />} label="Camara QR" />
          <Tab icon={<KeyboardIcon />} label="Manual" />
        </Tabs>
        <Box p={3}>
          {tabIndex === 0 && <QrScanner onScan={(d) => { setBarcode(d); validate(d); }} enabled={scanState === "idle" || scanState === "scanning"} />}
          {tabIndex === 1 && <Stack direction="row" gap={1}><TextField label="Codigo de barcode / QR" fullWidth autoFocus value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && validate(barcode)} placeholder="ZT-123|456|789|..." /><Button variant="contained" onClick={() => validate(barcode)} disabled={loading} sx={{ minWidth: 120 }}>{loading ? "..." : "Validar"}</Button></Stack>}
        </Box>
      </Paper>
      {result && scanState !== "idle" && scanState !== "scanning" && (
        <Paper sx={{ p: 3, borderLeft: `4px solid ${col}`, bgcolor: scanState === "valid" ? "rgba(16,185,129,0.05)" : scanState === "already_scanned" ? "rgba(245,158,11,0.05)" : "rgba(239,68,68,0.05)" }}>
          <Stack direction="row" alignItems="center" gap={1.5} mb={2}>{icon}<Typography variant="h4" fontWeight={800} color={col}>{label}</Typography></Stack>
          {result.ticket && (scanState === "valid" || scanState === "already_scanned") && (<><Divider sx={{ my: 2 }} /><Stack spacing={1}><Typography variant="h6" fontWeight={600}>{result.ticket.EventName}</Typography>{result.ticket.EventDate && <Typography variant="body2" color="text.secondary">{new Date(result.ticket.EventDate).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Typography>}{result.ticket.VenueName && <Typography variant="body2" color="text.secondary">{result.ticket.VenueName}</Typography>}<Divider /><Stack direction="row" gap={3} flexWrap="wrap"><Box><Typography variant="caption" color="text.secondary">Comprador</Typography><Typography variant="body2" fontWeight={600}>{result.ticket.BuyerName}</Typography></Box>{result.ticket.SectionName && <Box><Typography variant="caption" color="text.secondary">Seccion</Typography><Typography variant="body2" fontWeight={600}>{result.ticket.SectionName}</Typography></Box>}{result.ticket.RowLabel && <Box><Typography variant="caption" color="text.secondary">Fila</Typography><Typography variant="body2" fontWeight={600}>{result.ticket.RowLabel}</Typography></Box>}{result.ticket.SeatNumber != null && <Box><Typography variant="caption" color="text.secondary">Asiento</Typography><Typography variant="body2" fontWeight={600}>{result.ticket.SeatNumber}</Typography></Box>}</Stack></Stack></>)}
          {scanState === "already_scanned" && result.scannedAt && <Alert severity="warning" sx={{ mt: 2 }}>Este boleto ya fue escaneado el {new Date(result.scannedAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Alert>}
          {scanState === "invalid" && result.error && <Alert severity="error" sx={{ mt: 1 }}>{result.error === "ticket_cancelled" ? "Este boleto fue cancelado" : result.error === "ticket_not_found" ? "Boleto no encontrado" : result.error === "tampered_barcode" ? "Codigo manipulado — posible fraude" : result.error === "invalid_format" ? "Formato invalido" : result.error === "rate_limited" ? "Demasiados intentos" : result.error === "order_not_paid" ? "Orden no pagada" : result.error}</Alert>}
          <Button fullWidth variant="outlined" sx={{ mt: 3 }} onClick={reset}>Escanear otro boleto</Button>
        </Paper>
      )}
    </Box>
  );
}
