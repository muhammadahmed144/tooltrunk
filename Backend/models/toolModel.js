import crypto from 'crypto';
import { getMongoDb } from '../utils/mongo.js';

function mapToolDoc(doc) {
  if (!doc) return undefined;
  let features = [];
  let images = [];

  try {
    if (doc.features) {
      features = typeof doc.features === 'string' ? JSON.parse(doc.features) : doc.features;
    }
  } catch {
    features = [];
  }

  try {
    if (doc.images) {
      images = typeof doc.images === 'string' ? JSON.parse(doc.images) : doc.images;
    }
  } catch {
    images = [];
  }

  if (images.length === 0 && (doc.imageUrl || doc.image_url)) {
    images = [doc.imageUrl || doc.image_url];
  }

  return {
    id: doc.id,
    ownerId: doc.owner_id || doc.ownerId,
    ownerName: doc.owner_name || doc.ownerName,
    ownerAvatar: doc.owner_avatar || doc.ownerAvatar,
    name: doc.name,
    title: doc.title || doc.name,
    category: doc.category,
    pricePerDay: Number(doc.price_per_day || doc.pricePerDay),
    dailyPoints: Number(doc.daily_points || doc.dailyPoints || doc.price_per_day || doc.pricePerDay),
    rating: Number(doc.rating || 5.0),
    reviewsCount: Number(doc.reviews_count || doc.reviewsCount || 1),
    distanceKm: Number(doc.distance_km || doc.distanceKm || 1.5),
    postalCode: doc.postal_code || doc.postalCode,
    location: doc.location || doc.postal_code || doc.postalCode,
    status: doc.status || 'available',
    imageUrl: doc.image_url || doc.imageUrl || (images[0] || ''),
    images,
    description: doc.description || '',
    features,
    createdAt: doc.created_at || doc.createdAt,
    updatedAt: doc.updated_at || doc.updatedAt,
  };
}

export class ToolModel {
  /**
   * Public discovery endpoint supporting search query, category, and postal code.
   */
  static async findPublic({ search, category, postalCode } = {}) {
    const db = getMongoDb();
    const query = {};

    if (category && category !== 'All Categories') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (postalCode && postalCode.trim()) {
      query.postal_code = { $regex: new RegExp(postalCode.trim(), 'i') };
    }

    if (search && search.trim()) {
      const s = search.trim();
      const regex = new RegExp(s, 'i');
      query.$or = [
        { name: regex },
        { title: regex },
        { description: regex },
        { category: regex }
      ];
    }

    const docs = await db.collection('tools').find(query).sort({ created_at: -1 }).toArray();
    return docs.map(mapToolDoc);
  }

  /**
   * Finds all tools owned by a specific user.
   */
  static async findByOwner(ownerId) {
    const db = getMongoDb();
    const docs = await db.collection('tools').find({ owner_id: ownerId }).sort({ created_at: -1 }).toArray();
    return docs.map(mapToolDoc);
  }

  /**
   * Finds a single tool by its ID.
   */
  static async findById(id) {
    const db = getMongoDb();
    const doc = await db.collection('tools').findOne({ id });
    return mapToolDoc(doc);
  }

  /**
   * Creates a new tool record in MongoDB.
   */
  static async create(toolData) {
    const db = getMongoDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const price = Number(toolData.pricePerDay || toolData.dailyPoints || 500);
    const toolName = (toolData.name || toolData.title || '').trim();

    const featuresArray = Array.isArray(toolData.features)
      ? toolData.features
      : (typeof toolData.features === 'string' ? toolData.features.split('\n').filter(Boolean) : []);

    const imagesArray = Array.isArray(toolData.images) && toolData.images.length > 0
      ? toolData.images
      : [toolData.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'];

    const imageUrl = toolData.imageUrl || imagesArray[0];

    const newToolDoc = {
      id,
      owner_id: toolData.ownerId,
      owner_name: toolData.ownerName || 'Tool Owner',
      owner_avatar: toolData.ownerAvatar || '',
      name: toolName,
      title: toolName,
      category: (toolData.category || 'Equipment').trim(),
      price_per_day: price,
      daily_points: price,
      rating: 5.0,
      reviews_count: 1,
      distance_km: 1.5,
      postal_code: toolData.postalCode || '75000',
      location: toolData.location || toolData.postalCode || '75000',
      status: 'available',
      image_url: imageUrl,
      images: imagesArray,
      description: toolData.description || '',
      features: featuresArray,
      created_at: now,
      updated_at: now,
    };

    await db.collection('tools').insertOne(newToolDoc);
    return await ToolModel.findById(id);
  }

  /**
   * Updates an existing tool record. Only the owner can update.
   */
  static async update(id, ownerId, updates) {
    const db = getMongoDb();
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

    let featuresArray = existing.features;
    if (updates.features) {
      featuresArray = Array.isArray(updates.features) ? updates.features : [];
    }

    let imagesArray = existing.images;
    let imageUrl = existing.imageUrl;
    if (updates.images && Array.isArray(updates.images)) {
      imagesArray = updates.images;
      imageUrl = updates.images[0] || imageUrl;
    } else if (updates.imageUrl) {
      imageUrl = updates.imageUrl;
      imagesArray = [imageUrl];
    }

    await db.collection('tools').updateOne(
      { id, owner_id: ownerId },
      {
        $set: {
          name,
          title: name,
          category,
          status,
          price_per_day: price,
          daily_points: price,
          description,
          features: featuresArray,
          image_url: imageUrl,
          images: imagesArray,
          updated_at: now,
        }
      }
    );

    return await ToolModel.findById(id);
  }

  /**
   * Permanently deletes a tool. Only the owner can delete.
   */
  static async delete(id, ownerId) {
    const db = getMongoDb();
    const result = await db.collection('tools').deleteOne({ id, owner_id: ownerId });
    return result.deletedCount > 0;
  }
}
