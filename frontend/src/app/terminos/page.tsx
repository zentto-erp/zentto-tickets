"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

export default function TerminosPage() {
  return (
    <Box sx={{ bgcolor: "#0F0D2E", color: "#fff", minHeight: "100vh", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">
        <Typography variant="h3" fontWeight={800} sx={{ mb: 4 }}>
          Terminos de Uso
        </Typography>

        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, mb: 3 }}>
          Bienvenido a Zentto Tickets. Al utilizar nuestra plataforma, aceptas los siguientes terminos y condiciones.
        </Typography>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          1. Uso de la plataforma
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, mb: 3 }}>
          Zentto Tickets es una plataforma para la creacion, gestion y venta de boletos para eventos. Los usuarios deben
          proporcionar informacion veraz al registrarse y al crear eventos. El uso indebido de la plataforma puede resultar
          en la suspension o cancelacion de la cuenta.
        </Typography>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          2. Compra de boletos
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, mb: 3 }}>
          Todas las compras de boletos son finales salvo que el organizador del evento establezca una politica de
          reembolso. Zentto Tickets actua como intermediario entre organizadores y asistentes.
        </Typography>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          3. Responsabilidad
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, mb: 3 }}>
          Zentto Tickets no es responsable por la cancelacion, modificacion o calidad de los eventos publicados por
          organizadores. Cada organizador es responsable de cumplir con las leyes y regulaciones locales aplicables.
        </Typography>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          4. Contacto
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>
          Para consultas sobre estos terminos, escribenos a{" "}
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
