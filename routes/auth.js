
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../config/database');

// 로그인 화면
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');

  res.render('login', { error: null });
});

// 로그인 처리
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).render('login', {
        error: '이메일과 비밀번호를 입력해 주세요.'
      });
    }

    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email.trim()]
    );

    if (users.length === 0) {
      return res.status(401).render('login', {
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    const user = users[0];
    const matched = await bcrypt.compare(password, user.password);

    if (!matched) {
      return res.status(401).render('login', {
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('로그인 처리 오류');
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email
      };

      req.session.save((saveError) => {
        if (saveError) {
          console.error(saveError);
          return res.status(500).send('세션 저장 오류');
        }

        res.redirect('/dashboard');
      });
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('로그인 중 오류가 발생했습니다.');
  }
});

// 회원가입 화면
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');

  res.render('register', { error: null });
});

// 회원가입 처리
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, passwordConfirm } = req.body;

    if (!username || !email || !password || !passwordConfirm) {
      return res.status(400).render('register', {
        error: '모든 항목을 입력해 주세요.'
      });
    }

    if (password.length < 8) {
      return res.status(400).render('register', {
        error: '비밀번호는 8자 이상이어야 합니다.'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).render('register', {
        error: '비밀번호가 일치하지 않습니다.'
      });
    }

    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).render('register', {
        error: '이미 가입된 이메일입니다.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username.trim(), email.trim(), hashedPassword]
    );

    res.redirect('/login');

  } catch (error) {
    console.error(error);

    res.status(500).render('register', {
      error: '회원가입 중 오류가 발생했습니다.'
    });
  }
});

// 로그아웃
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('로그아웃 오류');
    }

    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

module.exports = router;
