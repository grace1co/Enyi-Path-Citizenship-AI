import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});

// Helper query function
async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// ---------- Users ----------
export async function getUserByEmail(email: string) {
  const res = await query("SELECT id, email, password_hash, profile_name, exam_date, created_at FROM users WHERE email = $1", [email]);
  return res.rows[0];
}

export async function getUserById(id: number) {
  const res = await query("SELECT id, email, password_hash, profile_name, exam_date, created_at FROM users WHERE id = $1", [id]);
  return res.rows[0];
}

export async function createUser(email: string, passwordHash: string, profileName: string, examDate: string) {
  const res = await query(
    `INSERT INTO users (email, password_hash, profile_name, exam_date, created_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [email, passwordHash, profileName, examDate || ""]
  );
  const user = res.rows[0];
  
  // Auto-createCompanion user_stats row matching LocalDB baseline defaults
  await query(
    `INSERT INTO user_stats (user_id, mastered_count, active_streak, last_quiz_score, total_time_studied, study_points, updated_at) 
     VALUES ($1, 64, 5, 8, 140, 340, NOW())`,
    [user.id]
  );
  return user;
}

// ---------- User Stats ----------
export async function getUserStats(userId: number) {
  let res = await query("SELECT user_id, mastered_count, active_streak, last_quiz_score, total_time_studied, study_points, updated_at FROM user_stats WHERE user_id = $1", [userId]);
  if (res.rows.length === 0) {
    await query(
      `INSERT INTO user_stats (user_id, mastered_count, active_streak, last_quiz_score, total_time_studied, study_points, updated_at) 
       VALUES ($1, 64, 5, 8, 140, 340, NOW())`,
      [userId]
    );
    res = await query("SELECT user_id, mastered_count, active_streak, last_quiz_score, total_time_studied, study_points, updated_at FROM user_stats WHERE user_id = $1", [userId]);
  }
  return res.rows[0];
}

export async function updateUserStats(userId: number, updates: Record<string, any>) {
  const keys = Object.keys(updates);
  if (keys.length === 0) return getUserStats(userId);
  
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map(k => updates[k]);
  values.push(userId);
  
  await query(`UPDATE user_stats SET ${setClause}, updated_at = NOW() WHERE user_id = $${values.length}`, values);
  return getUserStats(userId);
}

// ---------- Study Sessions ----------
export async function getStudySessions(userId: number) {
  const res = await query(
    "SELECT id, user_id, date, module, score, total_questions, type FROM study_sessions WHERE user_id = $1 ORDER BY date DESC",
    [userId]
  );
  return res.rows;
}

export async function createStudySession(userId: number, session: any) {
  const { id, date, module, score, total_questions, type } = session;
  await query(
    `INSERT INTO study_sessions (id, user_id, date, module, score, total_questions, type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET score = EXCLUDED.score, total_questions = EXCLUDED.total_questions, date = EXCLUDED.date`,
    [id, userId, date, module, score, total_questions, type]
  );
  return session;
}

export async function clearStudySessions(userId: number) {
  await query("DELETE FROM study_sessions WHERE user_id = $1", [userId]);
}

// ---------- Flashcard Mastery ----------
export async function getFlashcardMasteries(userId: number) {
  const res = await query(
    "SELECT flashcard_id, is_mastered FROM flashcard_mastery WHERE user_id = $1",
    [userId]
  );
  return res.rows;
}

export async function setFlashcardMastery(userId: number, flashcardId: number, isMastered: boolean) {
  await query(
    `INSERT INTO flashcard_mastery (user_id, flashcard_id, is_mastered)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, flashcard_id) DO UPDATE SET is_mastered = $3`,
    [userId, flashcardId, isMastered]
  );
  return { user_id: userId, flashcard_id: flashcardId, is_mastered: isMastered };
}

export async function resetFlashcardMasteries(userId: number) {
  await query("DELETE FROM flashcard_mastery WHERE user_id = $1", [userId]);
}

// ---------- Delete User Account Entirely ----------
export async function deleteUser(userId: number) {
  await query("DELETE FROM flashcard_mastery WHERE user_id = $1", [userId]);
  await query("DELETE FROM study_sessions WHERE user_id = $1", [userId]);
  await query("DELETE FROM user_stats WHERE user_id = $1", [userId]);
  await query("DELETE FROM users WHERE id = $1", [userId]);
}

