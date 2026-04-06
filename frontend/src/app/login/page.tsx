"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Box, TextField, Button, Typography, Alert, Stack, CircularProgress,
  IconButton, InputAdornment, Tooltip,
} from "@mui/material";
import BrandPanel from "../../components/erp/BrandPanel";
import ThemeToggle, { EyeIcon, EyeOffIcon } from "../../components/erp/ThemeToggle";

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
      router.refresh();
    }
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <BrandPanel
        title={<>Bienvenido a{" "}<Box component="span" sx={{ color: "#FFB547" }}>Zentto Tickets</Box></>}
        description="Plataforma de eventos, boletos y experiencias. Gestion completa de venues y carreras."
        modules={["Eventos", "Boletos", "Venues", "Carreras", "Escaneo"]}
      />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: { xs: 3, sm: 5 },
          bgcolor: "background.default",
          position: "relative",
        }}
      >
        <ThemeToggle sx={{ position: "absolute", top: 16, right: 16 }} />

        <Box sx={{ width: "100%", maxWidth: 400 }}>
          <Typography sx={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 700, fontSize: "1.25rem", letterSpacing: "-0.025em", mb: 0.5 }}>
            Iniciar sesion
          </Typography>
          <Typography sx={{ fontFamily: "'Inter', system-ui, sans-serif", color: "text.secondary", fontSize: "0.875rem", mb: 3 }}>
            Ingresa tus credenciales
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField label="Usuario" fullWidth value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" disabled={loading} required
                sx={{ "& input:-webkit-autofill": { WebkitBoxShadow: "0 0 0 100px transparent inset", WebkitTextFillColor: "inherit", transition: "background-color 5000s ease-in-out 0s" } }}
              />
              <TextField
                label="Contrasena" type={showPassword ? "text" : "password"} fullWidth value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" disabled={loading} required
                sx={{ "& input:-webkit-autofill": { WebkitBoxShadow: "0 0 0 100px transparent inset", WebkitTextFillColor: "inherit", transition: "background-color 5000s ease-in-out 0s" } }}
                slotProps={{
                  input: {
                    endAdornment: password ? (
                      <InputAdornment position="end">
                        <Tooltip title={showPassword ? "Ocultar" : "Mostrar"}>
                          <span><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={loading} size="small" sx={{ p: 0.5 }}>{showPassword ? <EyeOffIcon /> : <EyeIcon />}</IconButton></span>
                        </Tooltip>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />
              <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth sx={{ py: 1.75, fontWeight: 600, fontSize: "1rem", borderRadius: 2, mt: 1 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Iniciar Sesion"}
              </Button>
            </Stack>
          </form>
        </Box>
      </Box>
    </Box>
  );
}
