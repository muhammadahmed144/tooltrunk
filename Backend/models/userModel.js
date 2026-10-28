import crypto from 'crypto';
import { getMongoDb } from '../utils/mongo.js';
import { emailService } from '../services/emailService.js'; // agar zaroorat ho

export async function initDb() {
  console.log('ℹ️ MongoDB is active. Relational SQLite initDb is bypassed.');
}

function mapUserDoc(doc) {
  if (!doc) return undefined;
  let locationSettings = doc.location_settings || doc.locationSettings || { homeAddress: '', maxDistance: 10, publicLocation: false };
  if (typeof locationSettings === 'string') {
    try {
      locationSettings = JSON.parse(locationSettings);
    } catch {
      // fallback
    }
  }

  return {
    id: doc.id,
    fullName: doc.full_name || doc.fullName,
    email: doc.email,
    passwordHash: doc.password_hash || doc.passwordHash,
    postalCode: doc.postal_code || doc.postalCode,
    avatarUrl: doc.avatar_url || doc.avatarUrl || '',
    reputation: doc.reputation !== undefined ? doc.reputation : 100,
    locationSettings,
    createdAt: doc.created_at || doc.createdAt,
    updatedAt: doc.updated_at || doc.updatedAt,
  };
}

export class UserModel {
  static async findById(id) {
    const db = await getMongoDb(); // 👈 Yahan await lag gaya
    const doc = await db.collection('users').findOne({ id });
    if (!doc) return undefined;
    const user = mapUserDoc(doc);

    const logs = await db.collection('reputation_logs')
      .find({ user_id: id })
      .sort({ created_at: -1 })
      .toArray();

    user.reputationHistory = logs.map(l => ({
      id: l.id,
      points: l.points,
      description: l.description,
      timestamp: l.created_at
    }));

    return user;
  }

  static async findByEmail(email) {
    if (!email) return undefined;
    const cleanEmail = email.toLowerCase().trim();
    const db = await getMongoDb(); // 👈 Yahan await lag gaya
    const doc = await db.collection('users').findOne({ email: cleanEmail });
    if (!doc) return undefined;
    const user = mapUserDoc(doc);

    const logs = await db.collection('reputation_logs')
      .find({ user_id: user.id })
      .sort({ created_at: -1 })
      .toArray();

    user.reputationHistory = logs.map(l => ({
      id: l.id,
      points: l.points,
      description: l.description,
      timestamp: l.created_at
    }));

    return user;
  }

  static async create(userData) {
    const db = await getMongoDb(); // 👈 Yahan await lag gaya
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const locSettings = userData.locationSettings || { homeAddress: '', maxDistance: 10, publicLocation: false };

    const newUserDoc = {
      id,
      full_name: userData.fullName.trim(),
      email: userData.email.toLowerCase().trim(),
      password_hash: userData.passwordHash,
      postal_code: userData.postalCode.toUpperCase().trim(),
      avatar_url: userData.avatarUrl || '',
      reputation: 100,
      location_settings: locSettings,
      created_at: now,
      updated_at: now,
    };

    await db.collection('users').insertOne(newUserDoc);

    await db.collection('reputation_logs').insertOne({
      id: crypto.randomUUID(),
      user_id: id,
      points: 100,
      description: 'Joined ToolTrunk Neighbor Network',
      created_at: now,
    });

    return await UserModel.findById(id);
  }

  static async update(id, updates) {
    const db = await getMongoDb(); // 👈 Yahan await lag gaya
    const existing = await UserModel.findById(id);
    if (!existing) return null;

    const fullName = updates.fullName !== undefined ? updates.fullName : existing.fullName;
    const postalCode = updates.postalCode !== undefined ? updates.postalCode : existing.postalCode;
    const avatarUrl = updates.avatarUrl !== undefined ? updates.avatarUrl : existing.avatarUrl;
    const passwordHash = updates.passwordHash !== undefined ? updates.passwordHash : existing.passwordHash;
    const reputation = updates.reputation !== undefined ? updates.reputation : existing.reputation;
    const locSettings = updates.locationSettings !== undefined ? updates.locationSettings : existing.locationSettings;
    const now = new Date().toISOString();

    await db.collection('users').updateOne(
      { id },
      {
        $set: {
          full_name: fullName,
          postal_code: postalCode,
          avatar_url: avatarUrl,
          password_hash: passwordHash,
          reputation,
          location_settings: locSettings,
          updated_at: now,
        }
      }
    );

    return await UserModel.findById(id);
  }

  static async delete(id) {
    const db = await getMongoDb(); // 👈 Yahan await lag gaya
    const result = await db.collection('users').deleteOne({ id });
    await db.collection('reputation_logs').deleteMany({ user_id: id });
    return result.deletedCount > 0;
  }

  static async addReputation(id, points, description) {
    const db = await getMongoDb(); // 👈 Yahan await lag gaya
    const user = await UserModel.findById(id);
    if (!user) return null;

    const newRep = (user.reputation || 100) + Number(points);
    const now = new Date().toISOString();

    await db.collection('users').updateOne(
      { id },
      { $set: { reputation: newRep, updated_at: now } }
    );

    await db.collection('reputation_logs').insertOne({
      id: crypto.randomUUID(),
      user_id: id,
      points: Number(points),
      description,
      created_at: now,
    });

    return await UserModel.findById(id);
  }

  static hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  static verifyPassword(password, storedHash) {
    try {
      const [salt, originalHash] = storedHash.split(':');
      const hash = crypto.scryptSync(password, salt, 64).toString('hex');
      return hash === originalHash;
    } catch {
      return false;
    }
  }
}