import { findUserById, verifyToken } from '../services/authService.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        message: '로그인이 필요합니다.',
      });
    }

    const payload = verifyToken(token);
    const user = await findUserById(Number(payload.sub));

    if (!user) {
      return res.status(401).json({
        message: '유효하지 않은 사용자입니다.',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      message: '인증이 만료되었거나 올바르지 않습니다.',
    });
  }
}
