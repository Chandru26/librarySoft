import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { LoginFormData, LoginSuccessResponse, ApiErrorResponse, isApiErrorResponse } from '../types';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Avatar,
  Link as MuiLink,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    organizationIdentifier: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Partial<LoginFormData>>({});
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('authToken'));
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (validationErrors[e.target.name as keyof LoginFormData]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: undefined });
    }
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    if (!formData.organizationIdentifier.trim()) newErrors.organizationIdentifier = 'Organization identifier is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid.';
    }
    if (!formData.password) newErrors.password = 'Password is required.';

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post<LoginSuccessResponse>('/api/auth/login', formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('authUser', JSON.stringify(response.data.user));
        setIsAuthenticated(true);
        navigate('/dashboard'); // Redirect immediately after login
      } else {
        setError('Login successful, but no token received.');
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response && isApiErrorResponse(axiosError.response.data)) {
        setError(axiosError.response.data.message);
      } else if (axiosError.request) {
        setError('No response from server. Please check your network connection.');
      } else {
        setError('An unexpected error occurred during login.');
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}
    >
      <Paper elevation={6} sx={{ p: 4, borderRadius: 3, maxWidth: 400, width: '100%' }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main', mb: 1 }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography variant="h4" color="primary" fontWeight={700}>
            MyAppName
          </Typography>
          <Typography variant="h6" color="text.secondary" mt={1}>
            Sign in to your account
          </Typography>
        </Box>
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {successMessage && !isAuthenticated && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          <TextField
            margin="normal"
            fullWidth
            id="organizationIdentifier"
            name="organizationIdentifier"
            label="Organization Identifier"
            value={formData.organizationIdentifier}
            onChange={handleChange}
            error={!!validationErrors.organizationIdentifier}
            helperText={validationErrors.organizationIdentifier}
            autoFocus
          />
          <TextField
            margin="normal"
            fullWidth
            id="email"
            name="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!validationErrors.email}
            helperText={validationErrors.email}
          />
          <TextField
            margin="normal"
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={!!validationErrors.password}
            helperText={validationErrors.password}
          />
          <Box mt={2} mb={1}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Box>
          <Box mt={2} textAlign="center">
            <MuiLink
              component="button"
              variant="body2"
              onClick={() => navigate('/register')}
              sx={{ color: 'primary.main', textDecoration: 'underline' }}
            >
              Don't have an account? Sign up
            </MuiLink>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default LoginPage;
