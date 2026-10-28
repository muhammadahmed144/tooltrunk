import crypto from 'crypto';
import { db, hashPassword, verifyPassword, initDb as initializeDatabase } from '../utils/db.js';

export function initDb() {
  initializeDatabase();
}

function mapUserRow(row) {
  if (!row) return undefined;
  let locationSettings = { homeAddress: '', maxDistance: 10, publicLocation: false };
  try {
    if (row.location_settings) {
      locationSettings = typeof row.location_settings === 'string' ? JSON.parse(row.location_settings) : row.location_settings;
    }
  } catch {
    // fallback
  }

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    passwordHash: row.password_hash,
    postalCode: row.postal_code,
    avatarUrl: row.avatar_url || '',
    reputation: row.reputation || 100,
    locationSettings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UserModel {
  /**
   * Finds a single user by their unique ID.
   */
  static async findById(id) {
    const row = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!row) return undefined;
    const user = mapUserRow(row);

    // Attach reputation history
    const logs = await db.all(
      'SELECT id, points, description, created_at as timestamp FROM reputation_logs WHERE user_id = ? ORDER BY created_at DESC',
      [id]
    );
    user.reputationHistory = logs;
    return user;
  }

  /**
   * Finds a single user by their unique Email address.
   */
  static async findByEmail(email) {
    if (!email) return undefined;
    const cleanEmail = email.toLowerCase().trim();
    const row = await db.get('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (!row) return undefined;
    const user = mapUserRow(row);

    const logs = await db.all(
      'SELECT id, points, description, created_at as timestamp FROM reputation_logs WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );
    user.reputationHistory = logs;
    return user;
  }

  /**
   * Creates a new user record in the relational database.
   */
  static async create(userData) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const locSettings = JSON.stringify(userData.locationSettings || { homeAddress: '', maxDistance: 10, publicLocation: false });

    await db.run(
      `INSERT INTO users (id, full_name, email, password_hash, postal_code, avatar_url, reputation, location_settings, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userData.fullName.trim(),
        userData.email.toLowerCase().trim(),
        userData.passwordHash,
        userData.postalCode.toUpperCase().trim(),
        userData.avatarUrl || '',
        100,
        locSettings,
        now,
        now,
      ]
    );

    // Initial reputation log
    await db.run(
      `INSERT INTO reputation_logs (id, user_id, points, description, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), id, 100, 'Joined ToolTrunk Neighbor Network', now]
    );

    return await UserModel.findById(id);
  }

  /**
   * Updates an existing user record.
   */
  static async update(id, updates) {
    const existing = await UserModel.findById(id);
    if (!existing) return null;

    const fullName = updates.fullName !== undefined ? updates.fullName : existing.fullName;
    const postalCode = updates.postalCode !== undefined ? updates.postalCode : existing.postalCode;
    const avatarUrl = updates.avatarUrl !== undefined ? updates.avatarUrl : existing.avatarUrl;
    const passwordHash = updates.passwordHash !== undefined ? updates.passwordHash : existing.passwordHash;
    const reputation = updates.reputation !== undefined ? updates.reputation : existing.reputation;
    const locSettings = updates.locationSettings ? JSON.stringify(updates.locationSettings) : JSON.stringify(existing.locationSettings);
    const now = new Date().toISOString();

    await db.run(
      `UPDATE users
       SET full_name = ?, postal_code = ?, avatar_url = ?, password_hash = ?, reputation = ?, location_settings = ?, updated_at = ?
       WHERE id = ?`,
      [fullName, postalCode, avatarUrl, passwordHash, reputation, locSettings, now, id]
    );

    return await UserModel.findById(id);
  }

  /**
   * Permanently deletes a user record by ID.
   */
  static async delete(id) {
    const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
    return result.changes > 0;
  }

  /**
   * Increments user reputation and records a log entry.
   */
  static async addReputation(id, points, description) {
    const user = await UserModel.findById(id);
    if (!user) return null;

    const newRep = (user.reputation || 100) + Number(points);
    const now = new Date().toISOString();

    await db.run('UPDATE users SET reputation = ?, updated_at = ? WHERE id = ?', [newRep, now, id]);
    await db.run(
      'INSERT INTO reputation_logs (id, user_id, points, description, created_at) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), id, Number(points), description, now]
    );

    return await UserModel.findById(id);
  }

  /**
   * Helper utility to calculate password crypt hash using scrypt.
   */
  static hashPassword(password) {
    return hashPassword(password);
  }

  /**
   * Helper utility to compare plain text passwords with stored hashed values.
   */
  static verifyPassword(password, storedHash) {
    return verifyPassword(password, storedHash);
  }
}
