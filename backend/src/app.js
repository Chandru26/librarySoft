const express = require('express');
const app = express();

app.use(express.json());

// Import routes
const organizationRoutes = require('./routes/organizationRoutes');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes'); // Import book routes
const supportRoutes = require('./routes/supportRoutes'); // Import support routes

// Use routes
app.use('/api/organizations', organizationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes); // Use book routes
app.use('/api/support', supportRoutes); // Use support routes

app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running' });
});

module.exports = app;
