
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const requireLogin = require('../middleware/auth');

// 공부 기록 추가
router.post('/records', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { subject_id, duration, study_date, memo } = req.body;

    const subjectId = Number(subject_id);
    const minutes = Number(duration);

    if (
      !Number.isInteger(subjectId) ||
      subjectId < 1 ||
      !Number.isInteger(minutes) ||
      minutes < 1 ||
      minutes > 1440 ||
      !study_date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(study_date)
    ) {
      return res.status(400).send('입력 정보를 확인해 주세요.');
    }

    // 본인이 등록한 과목인지 확인
    const [subjects] = await db.execute(
      'SELECT id FROM subjects WHERE id = ? AND user_id = ?',
      [subjectId, userId]
    );

    if (subjects.length === 0) {
      return res.status(403).send('잘못된 과목입니다.');
    }

    // 공부 기록 저장
    await db.execute(
      `INSERT INTO study_records
       (user_id, subject_id, duration, study_date, memo)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, subjectId, minutes, study_date, memo || null]
    );

    res.redirect('/dashboard#records');

  } catch (error) {
    console.error('공부 기록 추가 오류:', error);
    res.status(500).send('공부 기록 저장에 실패했습니다.');
  }
});

// 공부 기록 삭제
router.post('/records/:id/delete', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const recordId = Number(req.params.id);

    if (!Number.isInteger(recordId) || recordId < 1) {
      return res.status(400).send('잘못된 기록 번호입니다.');
    }

    await db.execute(
      'DELETE FROM study_records WHERE id = ? AND user_id = ?',
      [recordId, userId]
    );

    res.redirect('/dashboard#records');

  } catch (error) {
    console.error('공부 기록 삭제 오류:', error);
    res.status(500).send('공부 기록 삭제에 실패했습니다.');
  }
});

module.exports = router;
