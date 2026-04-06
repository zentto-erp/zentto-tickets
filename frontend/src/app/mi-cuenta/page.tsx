'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import HistoryIcon from '@mui/icons-material/History';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
      {value === index && children}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/*  Placeholder data — will be replaced with API calls                 */
/* ------------------------------------------------------------------ */

const MOCK_TICKETS = [
  {
    id: 'TK-001',
    eventName: 'Festival Electronica 2026',
    date: '12 Abr 2026',
    venue: 'Arena Central',
    qty: 2,
    status: 'active',
    total: '$90.00',
  },
  {
    id: 'TK-002',
    eventName: 'Concierto Sinfonico',
    date: '5 May 2026',
    venue: 'Teatro Nacional',
    qty: 1,
    status: 'active',
    total: '$60.00',
  },
];

const MOCK_RACES = [
  {
    id: 'RC-001',
    raceName: 'Maraton Ciudad 10K',
    date: '20 Abr 2026',
    category: '10K Open',
    bib: '1247',
    status: 'confirmed',
  },
];

const MOCK_HISTORY = [
  {
    id: 'ORD-001',
    description: 'Festival Electronica 2026 x2',
    date: '1 Mar 2026',
    total: '$90.00',
    status: 'completed',
  },
  {
    id: 'ORD-002',
    description: 'Concierto Sinfonico x1',
    date: '15 Mar 2026',
    total: '$60.00',
    status: 'completed',
  },
  {
    id: 'ORD-003',
    description: 'Maraton Ciudad 10K - Inscripcion',
    date: '20 Mar 2026',
    total: '$25.00',
    status: 'completed',
  },
];

export default function MiCuentaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState(0);

  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const userName = session?.user?.name ?? 'Usuario';
  const userEmail = session?.user?.email ?? '';

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          background:
            'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
          py: { xs: 4, md: 5 },
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/')}
            sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}
          >
            Volver al inicio
          </Button>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: '#6366F1',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {userName[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{ color: '#fff' }}
              >
                {userName}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                {userEmail}
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Summary cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              label: 'Mis Boletos',
              value: MOCK_TICKETS.length,
              icon: <ConfirmationNumberIcon />,
              color: '#6366F1',
            },
            {
              label: 'Inscripciones',
              value: MOCK_RACES.length,
              icon: <DirectionsRunIcon />,
              color: '#F59E0B',
            },
            {
              label: 'Compras',
              value: MOCK_HISTORY.length,
              icon: <HistoryIcon />,
              color: '#22c55e',
            },
          ].map((item) => (
            <Grid size={{ xs: 4 }} key={item.label}>
              <Card sx={{ borderRadius: 3, textAlign: 'center' }}>
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ color: item.color, mb: 0.5 }}>
                    {item.icon}
                  </Box>
                  <Typography variant="h4" fontWeight={800}>
                    {item.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {item.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Tabs */}
        <Card sx={{ borderRadius: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              px: 2,
            }}
          >
            <Tab
              icon={<ConfirmationNumberIcon />}
              iconPosition="start"
              label="Mis Boletos"
            />
            <Tab
              icon={<DirectionsRunIcon />}
              iconPosition="start"
              label="Mis Carreras"
            />
            <Tab
              icon={<HistoryIcon />}
              iconPosition="start"
              label="Historial"
            />
          </Tabs>

          {/* Tab 0: Tickets */}
          <TabPanel value={tab} index={0}>
            <Box sx={{ px: 2 }}>
              {MOCK_TICKETS.map((ticket) => (
                <Card
                  key={ticket.id}
                  variant="outlined"
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  <CardContent>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ sm: 'center' }}
                      spacing={2}
                    >
                      <Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Typography
                            variant="h6"
                            fontWeight={700}
                          >
                            {ticket.eventName}
                          </Typography>
                          <Chip
                            label={
                              ticket.status === 'active'
                                ? 'Activo'
                                : 'Usado'
                            }
                            size="small"
                            color={
                              ticket.status === 'active'
                                ? 'success'
                                : 'default'
                            }
                          />
                        </Stack>
                        <Stack
                          direction="row"
                          spacing={2}
                          sx={{ color: 'text.secondary' }}
                        >
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <EventIcon sx={{ fontSize: 16 }} />
                            <Typography variant="body2">
                              {ticket.date}
                            </Typography>
                          </Stack>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <LocationOnIcon sx={{ fontSize: 16 }} />
                            <Typography variant="body2">
                              {ticket.venue}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {ticket.qty} boleto(s) — {ticket.total}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<QrCode2Icon />}
                        >
                          Ver QR
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                        >
                          PDF
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </TabPanel>

          {/* Tab 1: Races */}
          <TabPanel value={tab} index={1}>
            <Box sx={{ px: 2 }}>
              {MOCK_RACES.map((race) => (
                <Card
                  key={race.id}
                  variant="outlined"
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  <CardContent>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ sm: 'center' }}
                      spacing={2}
                    >
                      <Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Typography
                            variant="h6"
                            fontWeight={700}
                          >
                            {race.raceName}
                          </Typography>
                          <Chip
                            label="Confirmado"
                            size="small"
                            color="success"
                          />
                        </Stack>
                        <Stack
                          direction="row"
                          spacing={2}
                          sx={{ color: 'text.secondary' }}
                        >
                          <Typography variant="body2">
                            {race.date}
                          </Typography>
                          <Typography variant="body2">
                            Categoria: {race.category}
                          </Typography>
                        </Stack>
                      </Box>
                      <Chip
                        label={`Dorsal #${race.bib}`}
                        variant="outlined"
                        color="primary"
                        sx={{ fontWeight: 700, fontSize: '1rem' }}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </TabPanel>

          {/* Tab 2: History */}
          <TabPanel value={tab} index={2}>
            <Box sx={{ px: 2 }}>
              {MOCK_HISTORY.map((order) => (
                <Stack
                  key={order.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {order.description}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {order.id} — {order.date}
                    </Typography>
                  </Box>
                  <Stack alignItems="flex-end">
                    <Typography variant="body1" fontWeight={700}>
                      {order.total}
                    </Typography>
                    <Chip
                      label="Completado"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Stack>
                </Stack>
              ))}
            </Box>
          </TabPanel>
        </Card>
      </Container>
    </Box>
  );
}
