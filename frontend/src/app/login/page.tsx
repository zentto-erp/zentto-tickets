"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Credenciales invalidas. Verifica usuario y contrasena.");
    } else {
      router.push("/");
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1E1B4B 0%, #0F0D2E 50%, #1A1744 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative elements */}
      <Box sx={{
        position: "absolute", top: -150, right: -150,
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
      }} />
      <Box sx={{
        position: "absolute", bottom: -100, left: -100,
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)",
      }} />

      {/* Back to home */}
      <IconButton
        onClick={() => router.push("/")}
        sx={{
          position: "absolute",
          top: 24,
          left: 24,
          color: "rgba(255,255,255,0.5)",
          "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.05)" },
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      <Card
        sx={{
          maxWidth: 440,
          width: "100%",
          mx: 2,
          bgcolor: "rgba(26, 23, 68, 0.8)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(99,102,241,0.15)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
          {/* Header */}
          <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2.5,
                boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
              }}
            >
              <ConfirmationNumberIcon sx={{ fontSize: 32, color: "#fff" }} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: "#fff" }}>
              Bienvenido
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)", mt: 0.5 }}>
              Inicia sesion con tu cuenta Zentto
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                bgcolor: "rgba(239,68,68,0.1)",
                color: "#FCA5A5",
                border: "1px solid rgba(239,68,68,0.2)",
                "& .MuiAlert-icon": { color: "#EF4444" },
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Usuario"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                mb: 2.5,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.04)",
                  borderRadius: 2.5,
                  color: "#fff",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                  "&:hover fieldset": { borderColor: "rgba(99,102,241,0.4)" },
                  "&.Mui-focused fieldset": { borderColor: "#6366F1" },
                },
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" },
                "& .MuiInputLabel-root.Mui-focused": { color: "#818CF8" },
              }}
            />
            <TextField
              label="Contrasena"
              type={showPassword ? "text" : "password"}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                mb: 1,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.04)",
                  borderRadius: 2.5,
                  color: "#fff",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                  "&:hover fieldset": { borderColor: "rgba(99,102,241,0.4)" },
                  "&.Mui-focused fieldset": { borderColor: "#6366F1" },
                },
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" },
                "& .MuiInputLabel-root.Mui-focused": { color: "#818CF8" },
              }}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#818CF8",
                  cursor: "pointer",
                  "&:hover": { color: "#A5B4FC" },
                  transition: "color 0.2s",
                }}
              >
                Olvidaste tu contrasena?
              </Typography>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: "0.95rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                  boxShadow: "0 6px 20px rgba(99,102,241,0.4)",
                },
                "&:disabled": {
                  background: "rgba(99,102,241,0.3)",
                  color: "rgba(255,255,255,0.5)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#fff" }} />
              ) : (
                "Iniciar Sesion"
              )}
            </Button>
          </form>

          <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.25)", px: 1 }}>
              o
            </Typography>
          </Divider>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)" }}>
              No tienes cuenta?{" "}
              <Box
                component="span"
                sx={{
                  color: "#F59E0B",
                  fontWeight: 600,
                  cursor: "pointer",
                  "&:hover": { color: "#FBBF24" },
                  transition: "color 0.2s",
                }}
              >
                Contacta a tu organizador
              </Box>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
