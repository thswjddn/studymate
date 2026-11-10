
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const requireLogin = require('../middleware/auth');

router.post('/goals', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { title, target_minutes, deadline } = req.body;
    const minutes = Number(target_minutes);

    if (!title || !title.trim() ||
        !Number.isInteger(minutes) ||
        minutes < 1 || minutes > 1000000) {
      return res.status(400).send('입력 정보를 확인해 주세요.');
    }

    await db.execute(
      `INSERT INTO goals
       (user_id, title, target_minutes, deadline)
       VALUES (?, ?, ?, ?)`,
      [userId, title.trim(), minutes, deadline || null]
    );

    res.redirect('/dashboard#goals');
  } catch (error) {
    console.error(error);
    res.status(500).send('목표 등록 실패');
  }
});

router.post('/goals/:id/toggle', requireLogin, async (req, res) => {
  try {
    await db.execute(
      `UPDATE goals
       SET is_completed = NOT is_completed
       WHERE id = ? AND user_id = ?`,
      [Number(req.params.id), req.session.user.id]
    );

    res.redirect('/dashboard#goals');
  } catch (error) {
    console.error(error);
    res.status(500).send('목표 변경 실패');
  }
});

router.post('/goals/:id/delete', requireLogin, async (req, res) => {
  try {
    await db.execute(
      'DELETE FROM goals WHERE id = ? AND user_id = ?',
      [Number(req.params.id), req.session.user.id]
    );

    res.redirect('/dashboard#goals');
  } catch (error) {
    console.error(error);
    res.status(500).send('목표 삭제 실패');
  }
});

module.exports = router;
