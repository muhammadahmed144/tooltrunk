import crypto from 'crypto';
import { db } from '../utils/db.js';

function mapBookingRow(row) {
  if (!row) return undefined;
  return {
    id: row.id,
    toolId: row.tool_id,
    toolTitle: row.tool_title,
    toolImage: row.tool_image || '',
    pricePerDay: Number(row.price_per_day),
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    borrowerId: row.borrower_id,
    borrowerName: row.borrower_name,
    borrowerEmail: row.borrower_email || '',
    borrowerPostalCode: row.borrower_postal_code || '',
    startDate: row.start_date,
    endDate: row.end_date,
    totalDays: Number(row.total_days),
    totalPrice: Number(row.total_price),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class BookingModel {
  /**
   * Checks if a tool has any overlapping active or pending booking in the given date range.
   * State machine states that lock or check dates: 'Pending', 'Approved', 'Borrowed'.
   * Overlap rule: (reqStart <= existingEnd) AND (reqEnd >= existingStart)
   */
  static async hasCollision(toolId, startDate, endDate, excludeBookingId = null) {
    let sql = `
      SELECT id, start_date, end_date FROM bookings
      WHERE tool_id = ?
        AND status IN ('Pending', 'Approved', 'Borrowed')
        AND (start_date <= ? AND end_date >= ?)
    `;
    const params = [toolId, endDate, startDate];

    if (excludeBookingId) {
      sql += ' AND id != ?';
      params.push(excludeBookingId);
    }

    const conflicts = await db.all(sql, params);
    return conflicts.length > 0;
  }

  /**
   * Checks collision strictly against already Approved or Borrowed bookings.
   * Used when an owner approves a pending request to ensure no double-approval.
   */
  static async hasApprovedCollision(toolId, startDate, endDate, excludeBookingId = null) {
    let sql = `
      SELECT id, start_date, end_date FROM bookings
      WHERE tool_id = ?
        AND status IN ('Approved', 'Borrowed')
        AND (start_date <= ? AND end_date >= ?)
    `;
    const params = [toolId, endDate, startDate];

    if (excludeBookingId) {
      sql += ' AND id != ?';
      params.push(excludeBookingId);
    }

    const conflicts = await db.all(sql, params);
    return conflicts.length > 0;
  }

  /**
   * Automatically rejects other Pending requests that conflict with a newly Approved booking.
   */
  static async autoRejectConflictingPending(toolId, startDate, endDate, approvedBookingId) {
    const now = new Date().toISOString();
    await db.run(
      `UPDATE bookings
       SET status = 'Rejected', updated_at = ?
       WHERE tool_id = ?
         AND id != ?
         AND status = 'Pending'
         AND (start_date <= ? AND end_date >= ?)`,
      [now, toolId, approvedBookingId, endDate, startDate]
    );
  }

  /**
   * Retrieves all locked date ranges for a tool (for calendar widget).
   */
  static async getToolLockedRanges(toolId) {
    const rows = await db.all(
      `SELECT start_date, end_date, status FROM bookings
       WHERE tool_id = ? AND status IN ('Pending', 'Approved', 'Borrowed')
       ORDER BY start_date ASC`,
      [toolId]
    );

    return rows.map((r) => ({
      startDate: r.start_date,
      endDate: r.end_date,
      status: r.status,
    }));
  }

  /**
   * Atomically creates a new rental booking request inside an immediate transaction
   * to strictly eliminate concurrency race conditions and double-booking.
   * Calculates total price exactly using SRS formula: Total Price = Price Per Day * (End Date - Start Date)
   */
  static async createAtomic(bookingData) {
    await db.run('BEGIN IMMEDIATE');

    try {
      const hasConflict = await BookingModel.hasCollision(
        bookingData.toolId,
        bookingData.startDate,
        bookingData.endDate
      );

      if (hasConflict) {
        await db.run('ROLLBACK');
        const err = new Error('Selected dates overlap with an existing booking. Please choose different dates.');
        err.status = 409;
        throw err;
      }

      const [sY, sM, sD] = bookingData.startDate.split('-').map(Number);
      const [eY, eM, eD] = bookingData.endDate.split('-').map(Number);
      const startUtc = Date.UTC(sY, sM - 1, sD);
      const endUtc = Date.UTC(eY, eM - 1, eD);
      const totalDays = Math.round((endUtc - startUtc) / 86400000);

      if (totalDays <= 0) {
        await db.run('ROLLBACK');
        const err = new Error('Rental end date must be after the start date (minimum 1 day).');
        err.status = 400;
        throw err;
      }

      const pricePerDay = Number(bookingData.pricePerDay || 0);
      const totalPrice = pricePerDay * totalDays;

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.run(
        `INSERT INTO bookings (
          id, tool_id, tool_title, tool_image, price_per_day,
          owner_id, owner_name, borrower_id, borrower_name, borrower_email, borrower_postal_code,
          start_date, end_date, total_days, total_price, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          bookingData.toolId,
          bookingData.toolTitle || 'Tool',
          bookingData.toolImage || '',
          pricePerDay,
          bookingData.ownerId,
          bookingData.ownerName || 'Tool Owner',
          bookingData.borrowerId,
          bookingData.borrowerName || 'Borrower',
          bookingData.borrowerEmail || '',
          bookingData.borrowerPostalCode || '',
          bookingData.startDate,
          bookingData.endDate,
          totalDays,
          totalPrice,
          'Pending', // Initial state
          now,
          now,
        ]
      );

      await db.run('COMMIT');
      return await BookingModel.findById(id);
    } catch (err) {
      try {
        await db.run('ROLLBACK');
      } catch {
        // Rollback already executed or not active
      }
      throw err;
    }
  }

  /**
   * Legacy create wrapper delegating to atomic create.
   */
  static async create(bookingData) {
    return await BookingModel.createAtomic(bookingData);
  }

  /**
   * Finds a booking by ID.
   */
  static async findById(id) {
    const row = await db.get('SELECT * FROM bookings WHERE id = ?', [id]);
    return mapBookingRow(row);
  }

  /**
   * Finds all bookings where user is the borrower.
   */
  static async findByBorrower(borrowerId) {
    const rows = await db.all(
      'SELECT * FROM bookings WHERE borrower_id = ? ORDER BY created_at DESC',
      [borrowerId]
    );
    return rows.map(mapBookingRow);
  }

  /**
   * Finds all bookings for tools owned by the user.
   */
  static async findByOwner(ownerId) {
    const rows = await db.all(
      'SELECT * FROM bookings WHERE owner_id = ? ORDER BY created_at DESC',
      [ownerId]
    );
    return rows.map(mapBookingRow);
  }

  /**
   * Counts active or pending bookings for a given tool (used for deletion/update constraint check).
   */
  static async countActiveByTool(toolId) {
    const row = await db.get(
      `SELECT COUNT(*) as count FROM bookings
       WHERE tool_id = ? AND status IN ('Pending', 'Approved', 'Borrowed')`,
      [toolId]
    );
    return row ? row.count : 0;
  }

  /**
   * Transitions booking to a new state in the state machine:
   * 'Pending' -> 'Approved' | 'Rejected'
   * 'Approved' -> 'Borrowed'
   * 'Borrowed' -> 'Returned'
   */
  static async updateStatus(id, newStatus) {
    const now = new Date().toISOString();
    await db.run(
      'UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?',
      [newStatus, now, id]
    );
    return await BookingModel.findById(id);
  }
}
