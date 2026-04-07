'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Link from 'next/link';
import { authClient, AuthClientError } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await authClient.registerForApp({
        email,
        password,
        displayName: name,
        role: 'buyer',
        metadata: { phone },
      });

      /* Auto-login */
      const loginResult = await signIn('credentials', {
        username: email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        router.push('/login');
      } else {
        router.push('/mi-cuenta');
      }
    } catch (err) {
      setError(
        err instanceof AuthClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Error de conexion.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #1E1B4B 0%, #0F0D2E 50%, #1A1744 100%)',
        position: 'relative',
        overflow: 'hidden',
        p: 2,
      }}
    >
      {/* Decorative circles */}
      <Box
        sx={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)',
          top: -60,
          right: -60,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(245,158,11,0.1), transparent 70%)',
          bottom: -40,
          left: -40,
        }}
      />

      <Card
        sx={{
          maxWidth: 480,
          width: '100%',
          borderRadius: 4,
          bgcolor: 'rgba(26,23,68,0.95)',
          border: '1px solid rgba(99,102,241,0.15)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                background:
                  'linear-gradient(135deg, #6366F1, #F59E0B)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ConfirmationNumberIcon
                sx={{ color: '#fff', fontSize: 28 }}
              />
            </Box>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{ color: '#fff' }}
            >
              Crear Cuenta
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Registrate para comprar boletos y gestionar tus eventos
            </Typography>
          </Stack>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2, bgcolor: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon
                          sx={{ color: 'rgba(255,255,255,0.4)' }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(99,102,241,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(99,102,241,0.5)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.5)',
                  },
                }}
              />

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon
                          sx={{ color: 'rgba(255,255,255,0.4)' }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(99,102,241,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(99,102,241,0.5)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.5)',
                  },
                }}
              />

              <TextField
                fullWidth
                label="Telefono"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon
                          sx={{ color: 'rgba(255,255,255,0.4)' }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(99,102,241,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(99,102,241,0.5)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.5)',
                  },
                }}
              />

              <TextField
                fullWidth
                label="Contrasena"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon
                          sx={{ color: 'rgba(255,255,255,0.4)' }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          sx={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                          {showPassword ? (
                            <VisibilityOffIcon />
                          ) : (
                            <VisibilityIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(99,102,241,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(99,102,241,0.5)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.5)',
                  },
                }}
              />

              <TextField
                fullWidth
                label="Confirmar contrasena"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon
                          sx={{ color: 'rgba(255,255,255,0.4)' }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(99,102,241,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(99,102,241,0.5)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.5)',
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{
                  background:
                    'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  fontWeight: 700,
                  py: 1.5,
                  fontSize: '1rem',
                  borderRadius: 2,
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: '#fff' }} />
                ) : (
                  'Crear Cuenta'
                )}
              </Button>
            </Stack>
          </form>

          <Divider
            sx={{
              my: 2.5,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          />

          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center',
            }}
          >
            Ya tienes cuenta?{' '}
            <Typography
              component={Link}
              href="/login"
              variant="body2"
              sx={{
                color: '#818CF8',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Inicia Sesion
            </Typography>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
