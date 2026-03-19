import mysql from 'mysql2/promise';

let pool;

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function buildBaseConfig(includeDatabase = true) {
  const config = {
    host: getRequiredEnv('DB_HOST'),
    port: Number(process.env.DB_PORT || 3306),
    user: getRequiredEnv('DB_USER'),
    password: getRequiredEnv('DB_PASSWORD'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  if (includeDatabase) {
    config.database = getRequiredEnv('DB_NAME');
  }

  return config;
}

async function ensureDatabaseExists() {
  const databaseName = getRequiredEnv('DB_NAME');
  const connection = await mysql.createConnection(buildBaseConfig(false));

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await connection.end();
  }
}

async function ensureTablesExist() {
  const connection = await pool.getConnection();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        nickname VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS emotion_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        emotion VARCHAR(50) NOT NULL,
        emotion_category VARCHAR(30) NULL,
        note TEXT NOT NULL,
        intensity TINYINT NULL,
        tags JSON NULL,
        ai_summary TEXT NULL,
        ai_summary_created_at DATETIME NULL,
        logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await ensureColumnExists(connection, 'emotion_logs', 'user_id', 'INT NULL');
    await ensureColumnExists(connection, 'emotion_logs', 'emotion_category', 'VARCHAR(30) NULL');
    await ensureColumnExists(connection, 'emotion_logs', 'ai_summary', 'TEXT NULL');
    await ensureColumnExists(connection, 'emotion_logs', 'ai_summary_created_at', 'DATETIME NULL');
    await ensureIndexExists(connection, 'emotion_logs', 'idx_emotion_logs_user_id', 'user_id');
  } finally {
    connection.release();
  }
}

async function ensureColumnExists(connection, tableName, columnName, definition) {
  const databaseName = getRequiredEnv('DB_NAME');
  const [rows] = await connection.execute(
    `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [databaseName, tableName, columnName],
  );

  if (rows.length === 0) {
    await connection.query(`
      ALTER TABLE ${tableName}
      ADD COLUMN ${columnName} ${definition}
    `);
  }
}

async function ensureIndexExists(connection, tableName, indexName, columnName) {
  const databaseName = getRequiredEnv('DB_NAME');
  const [rows] = await connection.execute(
    `
      SELECT INDEX_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      LIMIT 1
    `,
    [databaseName, tableName, indexName],
  );

  if (rows.length === 0) {
    await connection.query(`
      CREATE INDEX ${indexName}
      ON ${tableName} (${columnName})
    `);
  }
}

export async function initializeDatabase() {
  if (pool) {
    return pool;
  }

  await ensureDatabaseExists();
  pool = mysql.createPool(buildBaseConfig(true));
  await ensureTablesExist();

  return pool;
}

export async function getDb() {
  if (!pool) {
    await initializeDatabase();
  }

  return pool;
}
