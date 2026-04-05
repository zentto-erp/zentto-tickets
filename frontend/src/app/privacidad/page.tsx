"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

export default function PrivacidadPage() {
  return (
    <Box sx={{ bgcolor: "#0F0D2E", color: "#fff", minHeight: "100vh", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">
        <Typography variant="h3" fontWeight={800} sx={{ mb: 4 }}>
          Politica de Privacidad
        </Typography>

        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, mb: 3 }}>
          En Zentto Tickets nos comprometemos a proteger tu informacion personal. Esta politica describe como
          recopilamos, usamos y protegemos tus datos.
        </Typography>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          1. Informacion que recopilamos
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, mb: 3 }}>
          Recopilamos informacion que proporcionas al registrarte (nombre, correo electronico), al comprar boletos
          (datos de pago procesados por terceros seguros) y al interactuar con la plataforma (preferencias, historial
          de eventos).
        </Typography>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          2. Uso de la informacion
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, mb: 3 }}>
          Utilizamos tu informacion para procesar compras de boletos, enviar confirmaciones y actualizaciones de
          eventos, mejorar la experiencia de usuario y cumplir con obligaciones legales.
        </Typography>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          3. Seguridad
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, mb: 3 }}>
          Implementamos medidas de seguridad tecnicas y organizativas para proteger tus datos. Los pagos son procesados
          por proveedores certificados PCI-DSS. No almacenamos datos de tarjetas de credito.
        </Typography>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          4. Contacto
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>
          Para consultas sobre privacidad, escribenos a{" "}
          <Box component="a" href="mailto:info@zentto.net" sx={{ color: "#818CF8" }}>
            info@zentto.net
          </Box>.
        </Typography>

        <Typography variant="caption" sx={{ display: "block", mt: 6, color: "rgba(255,255,255,0.3)" }}>
          Ultima actualizacion: Abril 2026
        </Typography>
      </Container>
    </Box>
  );
}
