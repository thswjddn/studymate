
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const requireLogin = require('../middleware/auth');

// 과목 추가
router.post('/subjects', requireLogin, async (req, res) => {
  try {
    const { name, color } = req.body;
    const userId = req.session.user.id;

    if (!name || !name.trim()) {
      return res.status(400).send('과목명을 입력해 주세요.');
    }

    await db.execute(
      'INSERT INTO subjects (user_id, name, color) VALUES (?, ?, ?)',
      [userId, name.trim(), color || '#6366f1']
    );

    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('과목 추가에 실패했습니다.');
  }
});

// 과목 삭제
router.post('/subjects/:id/delete', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const subjectId = Number(req.params.id);

    if (!Number.isInteger(subjectId) || subjectId < 1) {
      return res.status(400).send('잘못된 과목 번호입니다.');
    }

    await db.execute(
      'DELETE FROM subjects WHERE id = ? AND user_id = ?',
      [subjectId, userId]
    );

    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('과목 삭제에 실패했습니다.');
  }
});

module.exports = router;
