import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { RegistrationFormData, ApiSuccessResponse, ApiErrorResponse, isApiErrorResponse } from '../types';
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
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { useNavigate } from 'react-router-dom';

const RegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    organizationName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Partial<RegistrationFormData>>({});
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (validationErrors[e.target.name as keyof RegistrationFormData]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: undefined });
    }
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationFormData> = {};
    if (!formData.organizationName.trim()) newErrors.organizationName = 'Organization name is required.';
    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = 'Admin email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'Admin email is invalid.';
    }
    if (!formData.adminPassword) {
      newErrors.adminPassword = 'Admin password is required.';
    } else if (formData.adminPassword.length < 8) {
      newErrors.adminPassword = 'Password must be at least 8 characters long.';
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

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
      const { confirmPassword, ...dataToSubmit } = formData;
      const response = await axios.post<ApiSuccessResponse>('/api/organizations/register', dataToSubmit, {
        headers: { 'Content-Type': 'application/json' },
      });

      setSuccessMessage(response.data.message || 'Organization registered successfully! You can now try logging in.');
      setFormData({ organizationName: '', adminEmail: '', adminPassword: '', confirmPassword: '' });
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response && isApiErrorResponse(axiosError.response.data)) {
        setError(axiosError.response.data.message);
      } else if (axiosError.request) {
        setError('No response from server. Please check your network connection.');
      } else {
        setError('An unexpected error occurred during registration.');
      }
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #2563eb 100%)' }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 3, maxWidth: 400, width: '100%' }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main', mb: 1 }}>
            <GroupAddIcon />
          </Avatar>
          <Typography variant="h4" color="primary" fontWeight={700}>
            Register Organization
          </Typography>
        </Box>
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          <TextField
            margin="normal"
            fullWidth
            id="organizationName"
            name="organizationName"
            label="Organization Name"
            value={formData.organizationName}
            onChange={handleChange}
            error={!!validationErrors.organizationName}
            helperText={validationErrors.organizationName}
            autoFocus
          />
          <TextField
            margin="normal"
            fullWidth
            id="adminEmail"
            name="adminEmail"
            label="Admin Email"
            type="email"
            value={formData.adminEmail}
            onChange={handleChange}
            error={!!validationErrors.adminEmail}
            helperText={validationErrors.adminEmail}
          />
          <TextField
            margin="normal"
            fullWidth
            id="adminPassword"
            name="adminPassword"
            label="Admin Password"
            type="password"
            value={formData.adminPassword}
            onChange={handleChange}
            error={!!validationErrors.adminPassword}
            helperText={validationErrors.adminPassword}
          />
          <TextField
            margin="normal"
            fullWidth
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!validationErrors.confirmPassword}
            helperText={validationErrors.confirmPassword}
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
              {isLoading ? 'Registering...' : 'Register Organization'}
            </Button>
          </Box>
        </form>
        <Box mt={2} textAlign="center">
          <MuiLink
            component="button"
            variant="body2"
            onClick={() => navigate('/login')}
            sx={{ color: 'primary.main', textDecoration: 'underline' }}
          >
            Already have an account? Sign in
          </MuiLink>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegistrationPage;
