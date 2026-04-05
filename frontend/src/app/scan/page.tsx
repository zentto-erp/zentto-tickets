"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import { api } from "@/lib/api";

interface ScanResult {
  valid: boolean;
  error?: string;
  ticket?: {
    EventName: string;
    BuyerName: string;
    SectionName: string;
    RowLabel: string;
    SeatNumber: number;
    ScannedAt: string;
  };
  scannedAt?: string;
}

export default function ScanPage() {
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleScan() {
    if (!barcode.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await api.post<ScanResult>("/v1/scan/validate", { barcode: barcode.trim() });
      setResult(res);
    } catch (err) {
      setResult({ valid: false, error: String(err) });
    }

    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleScan();
  }

  return (
    <Box px={4} py={4} maxWidth={600} mx="auto">
      <Stack alignItems="center" mb={4}>
        <QrCodeScannerIcon sx={{ fontSize: 56, color: "primary.main", mb: 1 }} />
        <Typography variant="h4" fontWeight={700}>Escaneo de Boletos</Typography>
        <Typography variant="body2" color="text.secondary">
          Escanea el QR o ingresa el código del boleto
        </Typography>
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" gap={1}>
          <TextField
            label="Código de barcode / QR"
            fullWidth
            autoFocus
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ZT-123|456|789|..."
          />
          <Button
            variant="contained"
            onClick={handleScan}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? "..." : "Validar"}
          </Button>
        </Stack>
      </Paper>

      {result && (
        <Paper sx={{ p: 3, borderLeft: `4px solid ${result.valid ? "#10B981" : "#EF4444"}` }}>
          <Stack direction="row" alignItems="center" gap={1} mb={2}>
            {result.valid ? (
              <CheckCircleIcon sx={{ fontSize: 40, color: "#10B981" }} />
            ) : (
              <CancelIcon sx={{ fontSize: 40, color: "#EF4444" }} />
            )}
            <Typography variant="h5" fontWeight={700} color={result.valid ? "#10B981" : "#EF4444"}>
              {result.valid ? "VÁLIDO" : "INVÁLIDO"}
            </Typography>
          </Stack>

          {result.valid && result.ticket && (
            <>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Typography><strong>Evento:</strong> {result.ticket.EventName}</Typography>
                <Typography><strong>Nombre:</strong> {result.ticket.BuyerName}</Typography>
                <Typography><strong>Ubicación:</strong> {result.ticket.SectionName} — Fila {result.ticket.RowLabel}, Asiento {result.ticket.SeatNumber}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Escaneado: {new Date().toLocaleString("es")}
                </Typography>
              </Stack>
            </>
          )}

          {!result.valid && result.error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {result.error === "already_scanned" && `Este boleto ya fue escaneado el ${result.scannedAt}`}
              {result.error === "ticket_cancelled" && "Este boleto fue cancelado"}
              {result.error === "ticket_not_found" && "Boleto no encontrado en el sistema"}
              {result.error === "tampered_barcode" && "Código manipulado — posible fraude"}
              {result.error === "invalid_format" && "Formato de código inválido"}
              {!["already_scanned", "ticket_cancelled", "ticket_not_found", "tampered_barcode", "invalid_format"].includes(result.error) && result.error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => { setResult(null); setBarcode(""); }}
          >
            Escanear otro
          </Button>
        </Paper>
      )}
    </Box>
  );
}
