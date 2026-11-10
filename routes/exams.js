
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const requireLogin = require('../middleware/auth');

router.post('/exams', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { subject_name, exam_date, memo } = req.body;

    if (
      !subject_name ||
      !subject_name.trim() ||
      !exam_date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(exam_date)
    ) {
      return res.status(400).send('입력 정보를 확인해 주세요.');
    }

    await db.execute(
      `INSERT INTO exams
       (user_id, subject_name, exam_date, memo)
       VALUES (?, ?, ?, ?)`,
      [userId, subject_name.trim(), exam_date, memo || null]
    );

    res.redirect('/dashboard#exams');

  } catch (error) {
    console.error(error);
    res.status(500).send('시험 일정 등록 실패');
  }
});

router.post('/exams/:id/delete', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const examId = Number(req.params.id);

    if (!Number.isInteger(examId) || examId < 1) {
      return res.status(400).send('잘못된 시험 번호입니다.');
    }

    await db.execute(
      'DELETE FROM exams WHERE id = ? AND user_id = ?',
      [examId, userId]
    );

    res.redirect('/dashboard#exams');

  } catch (error) {
    console.error(error);
    res.status(500).send('시험 일정 삭제 실패');
  }
});

module.exports = router;
