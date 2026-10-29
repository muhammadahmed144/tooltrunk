import crypto from 'crypto';
import { getMongoDb } from '../utils/mongo.js';

function mapBookingDoc(doc) {
  if (!doc) return undefined;
  return {
    id: doc.id,
    toolId: doc.tool_id || doc.toolId,
    toolTitle: doc.tool_title || doc.toolTitle,
    toolImage: doc.tool_image || doc.toolImage,
    pricePerDay: Number(doc.price_per_day || doc.pricePerDay),
    ownerId: doc.owner_id || doc.ownerId,
    ownerName: doc.owner_name || doc.ownerName,
    borrowerId: doc.borrower_id || doc.borrowerId,
    borrowerName: doc.borrower_name || doc.borrowerName,
    borrowerEmail: doc.borrower_email || doc.borrowerEmail,
    borrowerPostalCode: doc.borrower_postal_code || doc.borrowerPostalCode,
    startDate: doc.start_date || doc.startDate,
    endDate: doc.end_date || doc.endDate,
    totalDays: Number(doc.total_days || doc.totalDays),
    totalPrice: Number(doc.total_price || doc.totalPrice),
    status: doc.status,
    createdAt: doc.created_at || doc.createdAt,
    updatedAt: doc.updated_at || doc.updatedAt,
  };
}

export class BookingModel {
  /**
   * Finds a single booking by its ID.
   */
  static async findById(id) {
    const db = await getMongoDb();
    const doc = await db.collection('bookings').findOne({ id });
    return mapBookingDoc(doc);
  }

  /**
   * Finds all bookings made by a specific borrower.
   */
  static async findByBorrower(borrowerId) {
    const db = await getMongoDb();
    const docs = await db.collection('bookings')
      .find({ borrower_id: borrowerId })
      .sort({ created_at: -1 })
      .toArray();
    return docs.map(mapBookingDoc);
  }

  /**
   * Finds all bookings for tools owned by a specific user.
   */
  static async findByOwner(ownerId) {
    const db = await getMongoDb();
    const docs = await db.collection('bookings')
      .find({ owner_id: ownerId })
      .sort({ created_at: -1 })
      .toArray();
    return docs.map(mapBookingDoc);
  }

  /**
   * Creates a new booking record in MongoDB.
   */
  static async create(bookingData) {
    const db = await getMongoDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newBookingDoc = {
      id,
      tool_id: bookingData.toolId,
      tool_title: bookingData.toolTitle,
      tool_image: bookingData.toolImage,
      price_per_day: Number(bookingData.pricePerDay),
      owner_id: bookingData.ownerId,
      owner_name: bookingData.ownerName,
      borrower_id: bookingData.borrowerId,
      borrower_name: bookingData.borrowerName,
      borrower_email: bookingData.borrowerEmail,
      borrower_postal_code: bookingData.borrowerPostalCode,
      start_date: bookingData.startDate,
      end_date: bookingData.endDate,
      total_days: Number(bookingData.totalDays),
      total_price: Number(bookingData.totalPrice),
      status: bookingData.status || 'Pending',
      created_at: now,
      updated_at: now,
    };

    await db.collection('bookings').insertOne(newBookingDoc);
    return await BookingModel.findById(id);
  }

  /**
   * Updates booking status (e.g., Pending -> Approved, Borrowed, etc.)
   */
  static async updateStatus(id, status) {
    const db = await getMongoDb();
    const now = new Date().toISOString();
    await db.collection('bookings').updateOne(
      { id },
      { $set: { status, updated_at: now } }
    );
    return await BookingModel.findById(id);
  }

  /**
   * Deletes a booking record by ID.
   */
  static async delete(id) {
    const db = await getMongoDb();
    const result = await db.collection('bookings').deleteOne({ id });
    return result.deletedCount > 0;
  }
}