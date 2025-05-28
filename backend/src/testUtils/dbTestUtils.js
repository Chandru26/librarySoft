const { pool } = require('../db/db'); // Adjust path as necessary

/**
 * Drops a schema if it exists.
 * @param {string} schemaName - The name of the schema to drop.
 */
async function dropSchemaIfExists(schemaName) {
  if (!schemaName || !/^[a-zA-Z0-9_]+$/.test(schemaName)) {
    console.warn(`Attempted to drop invalid schema name: ${schemaName}. Skipping.`);
    return;
  }
  try {
    console.log(`Attempting to drop schema: ${schemaName}`);
    await pool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    console.log(`Schema ${schemaName} dropped successfully or did not exist.`);
  } catch (error) {
    console.error(`Error dropping schema ${schemaName}:`, error);
    // Depending on test requirements, you might want to throw this error
    // or handle it (e.g., if tests might try to drop non-existent schemas often)
  }
}

/**
 * Deletes an organization from the public.organizations table by its name.
 * @param {string} organizationName - The name of the organization to delete.
 */
async function deleteOrganizationByName(organizationName) {
  try {
    console.log(`Attempting to delete organization: ${organizationName}`);
    const result = await pool.query('DELETE FROM public.organizations WHERE name = $1 RETURNING schema_name;', [organizationName]);
    if (result.rowCount > 0) {
      console.log(`Organization ${organizationName} deleted successfully from public.organizations.`);
      return result.rows[0].schema_name; // Return the schema_name for further cleanup if needed
    } else {
      console.log(`Organization ${organizationName} not found in public.organizations.`);
      return null;
    }
  } catch (error) {
    console.error(`Error deleting organization ${organizationName}:`, error);
    // Handle or throw as per test requirements
  }
}

/**
 * Cleans up all test-related data.
 * This function could be more sophisticated, e.g., by tracking created schemas
 * and dropping them specifically. For now, it demonstrates the concept.
 * A common pattern for test schemas is to prefix them, e.g., 'test_org_'.
 */
async function cleanupTestOrganizations(schemaPrefix = 'org_test_') {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Find schemas created by tests (e.g., based on a prefix)
    const res = await client.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE $1 || '%'",
      [schemaPrefix]
    );

    for (const row of res.rows) {
      console.log(`Dropping test schema: ${row.schema_name}`);
      await client.query(`DROP SCHEMA IF EXISTS "${row.schema_name}" CASCADE`);
    }

    // Delete organizations from public.organizations table that match the prefix
    // This assumes schema_name in public.organizations also follows the prefix naming
    await client.query("DELETE FROM public.organizations WHERE schema_name LIKE $1 || '%'", [schemaPrefix]);

    await client.query('COMMIT');
    console.log('Test organizations and schemas cleaned up.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during test data cleanup:', error);
  } finally {
    client.release();
  }
}


module.exports = {
  dropSchemaIfExists,
  deleteOrganizationByName,
  cleanupTestOrganizations,
  // You might add functions here to directly interact with the DB for setup/teardown
  // e.g., createUserInSchema(schemaName, userData), getOrganizationByName(orgName)
};
