
require('dotenv').config();
const examRoutes = require('./routes/exams');
const goalRoutes = require('./routes/goals');
const express = require('express');
const session = require('express-session');
const path = require('path');

const db = require('./config/database');
const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const recordRoutes = require('./routes/records');
const requireLogin = require('./middleware/auth');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

app.use(authRoutes);
app.use(subjectRoutes);
app.use(recordRoutes);
app.use(examRoutes);
app.use(goalRoutes);
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id;

    const [subjects] = await db.execute(
      'SELECT * FROM subjects WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );

    const [records] = await db.execute(
      `SELECT study_records.*, subjects.name AS subject_name
       FROM study_records
       JOIN subjects ON study_records.subject_id = subjects.id
       WHERE study_records.user_id = ?
       ORDER BY study_records.study_date DESC, study_records.id DESC
       LIMIT 50`,
      [userId]
    );

    const [goals] = await db.execute(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );

    const [exams] = await db.execute(
      'SELECT * FROM exams WHERE user_id = ? ORDER BY exam_date ASC',
      [userId]
    );

    const [stats] = await db.execute(
      `SELECT
        COALESCE(SUM(duration), 0) AS total_minutes,
        COUNT(*) AS total_records
       FROM study_records
       WHERE user_id = ?`,
      [userId]
    );

    res.render('dashboard', {
      subjects,
      records,
      goals,
      exams,
      stats: stats[0]
    });

  } catch (error) {
    console.error('대시보드 오류:', error);
    res.status(500).send('대시보드 데이터 조회 오류');
  }
});

app.get('/health', (req, res) => {
  res.send('StudyMate AI Server is running!');
});

async function startServer() {
  try {
    await db.query('SELECT 1');

    console.log('MySQL 데이터베이스 연결 성공');

    const port = process.env.PORT || 3000;

    app.listen(port, '0.0.0.0', () => {
      console.log(`StudyMate AI 실행 중: http://localhost:${port}`);
    });

  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

startServer();
