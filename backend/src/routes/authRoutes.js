const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/db'); // Assuming db.js is in ../db/
require('dotenv').config();

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { organizationIdentifier, email, password } = req.body;

  // Basic validation
  if (!organizationIdentifier || !email || !password) {
    return res.status(400).json({ message: 'Organization identifier, email, and password are required.' });
  }

  try {
    console.log(`[LOGIN ATTEMPT] OrgID: '${organizationIdentifier}', Email: '${email}'`); // Log initial input

    // 1. Determine Organization Schema
    //    If organizationIdentifier is a number, check ID first, then case-insensitive name.
    //    Otherwise, check case-insensitive name only.
    let orgQueryText;
    let orgParams;

    if (!isNaN(parseInt(organizationIdentifier))) {
        // If organizationIdentifier can be parsed as an int, it could be an ID or a name that is all numbers.
        orgQueryText = 'SELECT id, name, schema_name FROM public.organizations WHERE id = $1 OR LOWER(name) = LOWER($2)';
        orgParams = [parseInt(organizationIdentifier), organizationIdentifier.toString()];
    } else {
        // If organizationIdentifier is not a number, treat as name only (case-insensitive).
        orgQueryText = 'SELECT id, name, schema_name FROM public.organizations WHERE LOWER(name) = LOWER($1)';
        orgParams = [organizationIdentifier];
    }
    console.log(`[LOGIN DB] Querying organization with identifier: '${organizationIdentifier}'. SQL: ${orgQueryText.replace(/\s+/g, ' ')} PARAMS: ${JSON.stringify(orgParams)}`);
    const orgResult = await query(orgQueryText, orgParams);
    console.log(`[LOGIN DB] Organization query result count: ${orgResult.rows.length}`);

    if (orgResult.rows.length === 0) {
      console.log(`[LOGIN FAIL] Organization not found for identifier: '${organizationIdentifier}'`);
      return res.status(401).json({ message: 'Invalid organization, email, or password.' }); // Generic message
    }

    const organization = orgResult.rows[0];
    const schemaName = organization.schema_name;
    const organizationId = organization.id; // Also log this
    console.log(`[LOGIN INFO] Found organization: Name='${organization.name}', ID='${organizationId}', Schema='${schemaName}'`);

    // 2. Verify User Credentials
    //    Ensure schemaName is valid and escape it properly to prevent SQL injection.
    //    While getClient().escapeIdentifier(schemaName) would be ideal, pg.Pool's query method
    //    doesn't directly expose escapeIdentifier. We trust schema_name from DB.
    //    A more secure approach for dynamic schema names would be to use a dedicated function
    //    or ensure schema_name is strictly alphanumeric and underscores.
    if (!schemaName || !/^[a-zA-Z0-9_]+$/.test(schemaName)) {
        console.error(`[LOGIN ERROR] Invalid schema name format retrieved: ${schemaName}`);
        return res.status(500).json({ message: 'Internal server error due to invalid schema format.' });
    }

    const userQuery = `SELECT id, email, password_hash, role FROM "${schemaName}".users WHERE email = $1`; // Use a distinct var for logging
    console.log(`[LOGIN DB] Querying user: Email='${email}' in Schema='${schemaName}'. SQL: ${userQuery.replace(/\s+/g, ' ')} PARAMS: ${JSON.stringify([email])}`);
    const userResult = await query(userQuery, [email]); // Ensure this uses the correct query text variable
    console.log(`[LOGIN DB] User query result count: ${userResult.rows.length}`);

    if (userResult.rows.length === 0) {
      console.log(`[LOGIN FAIL] User not found: Email='${email}' in Schema='${schemaName}'`);
      return res.status(401).json({ message: 'Invalid organization, email, or password.' }); // Generic message
    }

    const user = userResult.rows[0];
    console.log(`[LOGIN INFO] Found user: Email='${user.email}', ID='${user.id}'`);

    const trimmedPassword = password.trim();
    console.log(`[LOGIN AUTH] Comparing password for user '${user.email}'. Provided (after trim) password length: ${trimmedPassword.length}, Stored hash: '${user.password_hash}'`);
    const isPasswordMatch = await bcrypt.compare(trimmedPassword, user.password_hash);
    console.log(`[LOGIN AUTH] Password comparison result: ${isPasswordMatch}`);

    if (!isPasswordMatch) {
      console.log(`[LOGIN FAIL] Password mismatch for user '${user.email}'`);
      return res.status(401).json({ message: 'Invalid organization, email, or password.' }); // Generic message
    }

    console.log(`[LOGIN SUCCESS] User '${user.email}' authenticated successfully for organization '${organization.name}'.`);
    // 3. Generate JWT
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: organizationId,
      organizationName: organization.name,
      organizationSchema: schemaName,
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error("JWT_SECRET is not defined in environment variables.");
        return res.status(500).json({ message: "Internal server error: JWT configuration missing." });
    }

    const token = jwt.sign(jwtPayload, jwtSecret, { expiresIn: '1h' }); // Token expires in 1 hour

    res.status(200).json({
      message: 'Login successful.',
      token: token,
      user: { // Send back some user info, excluding sensitive data like password_hash
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: organizationId,
        organizationName: organization.name
      }
    });

  } catch (error) {
    console.error('[LOGIN ERROR] Exception caught in login route:', error); // Enhanced error log
    // Check if it's an error from trying to query a non-existent schema/table
    if (error.code === '42P01') { // undefined_table
        // This might happen if schemaName was somehow incorrect or table doesn't exist
        return res.status(401).json({ message: 'Invalid organization, email, or password.' });
    }
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

module.exports = router;
