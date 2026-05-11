export async function ensureUser(db: D1Database, userId: string) {
  await db
    .prepare("INSERT OR IGNORE INTO users (id, kai_name, kai_tone, primary_engine) VALUES (?, 'Kai', 'balanced', 'physical')")
    .bind(userId)
    .run();
}
