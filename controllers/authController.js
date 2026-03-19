import { loginUser, registerUser } from '../services/authService.js';

export async function signUp(req, res, next) {
  try {
    const { email, password, nickname } = req.body;

    if (!email || !password || !nickname) {
      return res.status(400).json({
        message: 'email, password, nickname이 모두 필요합니다.',
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        message: '비밀번호는 6자 이상이어야 합니다.',
      });
    }

    const auth = await registerUser({ email, password, nickname });
    return res.status(201).json(auth);
  } catch (error) {
    return next(error);
  }
}

export async function signIn(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'email과 password가 필요합니다.',
      });
    }

    const auth = await loginUser({ email, password });
    return res.json(auth);
  } catch (error) {
    return next(error);
  }
}

export async function getMe(req, res) {
  res.json({
    user: req.user,
  });
}
