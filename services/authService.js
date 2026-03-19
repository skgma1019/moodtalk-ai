import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from './databaseService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'moodtalk-dev-secret';

export async function registerUser({ email, password, nickname }) {
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);

  if (existing) {
    throw new Error('이미 가입된 이메일입니다.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await db.execute(
    `
      INSERT INTO users (email, password_hash, nickname)
      VALUES (?, ?, ?)
    `,
    [normalizedEmail, passwordHash, nickname.trim()],
  );

  const user = await findUserById(result.insertId);
  return buildAuthPayload(user);
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  return buildAuthPayload(user);
}

export async function findUserById(id) {
  const db = await getDb();
  const [rows] = await db.execute(
    `
      SELECT id, email, nickname, password_hash, created_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  return rows[0] || null;
}

async function findUserByEmail(email) {
  const db = await getDb();
  const [rows] = await db.execute(
    `
      SELECT id, email, nickname, password_hash, created_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [email],
  );

  return rows[0] || null;
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function buildAuthPayload(user) {
  const safeUser = {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    createdAt: user.created_at,
  };

  const token = jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      nickname: user.nickname,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );

  return {
    token,
    user: safeUser,
  };
}
