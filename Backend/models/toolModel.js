import crypto from 'crypto';
import { db } from '../utils/db.js';

function mapToolRow(row) {
  if (!row) return undefined;
  let features = [];
  let images = [];

  try {
    if (row.features) {
      features = typeof row.features === 'string' ? JSON.parse(row.features) : row.features;
    }
  } catch {
    features = [];
  }

  try {
    if (row.images) {
      images = typeof row.images === 'string' ? JSON.parse(row.images) : row.images;
    }
  } catch {
    images = [];
  }

  if (images.length === 0 && row.image_url) {
    images = [row.image_url];
  }

  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerAvatar: row.owner_avatar,
    name: row.name,
    title: row.title || row.name,
    category: row.category,
    pricePerDay: Number(row.price_per_day),
    dailyPoints: Number(row.daily_points || row.price_per_day),
    rating: Number(row.rating || 5.0),
    reviewsCount: Number(row.reviews_count || 1),
    distanceKm: Number(row.distance_km || 1.5),
    postalCode: row.postal_code,
    location: row.location || row.postal_code,
    status: row.status || 'available',
    imageUrl: row.image_url || (images[0] || ''),
    images,
    description: row.description || '',
    features,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ToolModel {
  /**
   * Public discovery endpoint supporting search query, category, and postal code.
   */
  static async findPublic({ search, category, postalCode } = {}) {
    let sql = 'SELECT * FROM tools WHERE 1=1';
    const params = [];

    if (category && category !== 'All Categories') {
      sql += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }

    if (postalCode && postalCode.trim()) {
      sql += ' AND postal_code LIKE ?';
      params.push(`%${postalCode.trim()}%`);
    }

    if (search && search.trim()) {
      const s = `%${search.trim().toLowerCase()}%`;
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ?)';
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = await db.all(sql, params);
    return rows.map(mapToolRow);
  }

  /**
   * Finds all tools owned by a specific user.
   */
  static async findByOwner(ownerId) {
    const rows = await db.all('SELECT * FROM tools WHERE owner_id = ? ORDER BY created_at DESC', [ownerId]);
    return rows.map(mapToolRow);
  }

  /**
   * Finds a single tool by its ID.
   */
  static async findById(id) {
    const row = await db.get('SELECT * FROM tools WHERE id = ?', [id]);
    return mapToolRow(row);
  }

  /**
   * Creates a new tool record in the relational database.
   */
  static async create(toolData) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const price = Number(toolData.pricePerDay || toolData.dailyPoints || 500);
    const toolName = (toolData.name || toolData.title || '').trim();

    const featuresJson = JSON.stringify(
      Array.isArray(toolData.features)
        ? toolData.features
        : (typeof toolData.features === 'string' ? toolData.features.split('\n').filter(Boolean) : [])
    );

    const imagesArray = Array.isArray(toolData.images) && toolData.images.length > 0
      ? toolData.images
      : [toolData.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'];

    const imageUrl = toolData.imageUrl || imagesArray[0];

    await db.run(
      `INSERT INTO tools (id, owner_id, owner_name, owner_avatar, name, title, category, price_per_day, daily_points, rating, reviews_count, distance_km, postal_code, location, status, image_url, images, description, features, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        toolData.ownerId,
        toolData.ownerName || 'Tool Owner',
        toolData.ownerAvatar || '',
        toolName,
        toolName,
        (toolData.category || 'Equipment').trim(),
        price,
        price,
        5.0,
        1,
        1.5,
        toolData.postalCode || '75000',
        toolData.location || toolData.postalCode || '75000',
        'available',
        imageUrl,
        JSON.stringify(imagesArray),
        toolData.description || '',
        featuresJson,
        now,
        now,
      ]
    );

    return await ToolModel.findById(id);
  }

  /**
   * Updates an existing tool record. Only the owner can update.
   */
  static async update(id, ownerId, updates) {
    const existing = await ToolModel.findById(id);
    if (!existing || existing.ownerId !== ownerId) {
      return null;
    }

    const now = new Date().toISOString();
    const name = updates.name || updates.title || existing.name;
    const category = updates.category || existing.category;
    const status = updates.status || existing.status;
    const price = updates.pricePerDay !== undefined ? Number(updates.pricePerDay) : existing.pricePerDay;
    const description = updates.description !== undefined ? updates.description : existing.description;

    let featuresJson = JSON.stringify(existing.features);
    if (updates.features) {
      featuresJson = JSON.stringify(Array.isArray(updates.features) ? updates.features : []);
    }

    let imagesJson = JSON.stringify(existing.images);
    let imageUrl = existing.imageUrl;
    if (updates.images && Array.isArray(updates.images)) {
      imagesJson = JSON.stringify(updates.images);
      imageUrl = updates.images[0] || imageUrl;
    } else if (updates.imageUrl) {
      imageUrl = updates.imageUrl;
      imagesJson = JSON.stringify([imageUrl]);
    }

    await db.run(
      `UPDATE tools
       SET name = ?, title = ?, category = ?, status = ?, price_per_day = ?, daily_points = ?, description = ?, features = ?, image_url = ?, images = ?, updated_at = ?
       WHERE id = ? AND owner_id = ?`,
      [
        name,
        name,
        category,
        status,
        price,
        price,
        description,
        featuresJson,
        imageUrl,
        imagesJson,
        now,
        id,
        ownerId,
      ]
    );

    return await ToolModel.findById(id);
  }

  /**
   * Permanently deletes a tool. Only the owner can delete.
   */
  static async delete(id, ownerId) {
    const result = await db.run('DELETE FROM tools WHERE id = ? AND owner_id = ?', [id, ownerId]);
    return result.changes > 0;
  }
}
