import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store database file in Backend directory
const DB_FILE = path.resolve(__dirname, '..', 'tooltrunk.db');

let dbInstance = null;

/**
 * Initializes and returns the relational SQLite database connection
 */
export function getDbConnection() {
  if (dbInstance) {
    return dbInstance;
  }

  const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
      console.error('Failed to open ToolTrunk SQLite relational database:', err);
    } else {
      console.log('Connected to ToolTrunk relational SQLite database at:', DB_FILE);
    }
  });

  // Enable WAL mode and foreign key constraints for robust relational data integrity
  db.run('PRAGMA foreign_keys = ON;');
  db.run('PRAGMA journal_mode = WAL;');

  dbInstance = db;
  return dbInstance;
}

/**
 * Promise-based query helpers for relational database operations
 */
export const db = {
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      const conn = getDbConnection();
      conn.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      const conn = getDbConnection();
      conn.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  },

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      const conn = getDbConnection();
      conn.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },

  exec(sql) {
    return new Promise((resolve, reject) => {
      const conn = getDbConnection();
      conn.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
};

/**
 * Helper to calculate password crypt hash using scrypt
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Helper to verify password
 */
export function verifyPassword(password, storedHash) {
  try {
    const [salt, originalHash] = storedHash.split(':');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return hash === originalHash;
  } catch {
    return false;
  }
}

/**
 * Initializes relational schema and seeds initial data matching SRS and reference UI
 */
export async function initDb() {
  console.log('Initializing ToolTrunk Relational Database Schema...');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      avatar_url TEXT DEFAULT '',
      reputation INTEGER DEFAULT 100,
      location_settings TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      owner_name TEXT,
      owner_avatar TEXT,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      price_per_day REAL NOT NULL,
      daily_points REAL,
      rating REAL DEFAULT 5.0,
      reviews_count INTEGER DEFAULT 1,
      distance_km REAL DEFAULT 1.5,
      postal_code TEXT NOT NULL,
      location TEXT,
      status TEXT DEFAULT 'available',
      image_url TEXT,
      images TEXT,
      description TEXT,
      features TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      tool_id TEXT NOT NULL,
      tool_title TEXT,
      tool_image TEXT,
      price_per_day REAL NOT NULL,
      owner_id TEXT NOT NULL,
      owner_name TEXT,
      borrower_id TEXT NOT NULL,
      borrower_name TEXT,
      borrower_email TEXT,
      borrower_postal_code TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_days INTEGER NOT NULL,
      total_price REAL NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Borrowed', 'Returned')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE RESTRICT,
      FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (borrower_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reputation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_collision ON bookings (tool_id, status, start_date, end_date);
    CREATE INDEX IF NOT EXISTS idx_bookings_borrower ON bookings (borrower_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_owner ON bookings (owner_id);
    CREATE INDEX IF NOT EXISTS idx_tools_postal ON tools (postal_code);
    CREATE INDEX IF NOT EXISTS idx_tools_owner ON tools (owner_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
  `);

  console.log('Relational schema and indexes successfully verified.');

  // Check if users exist; if not, seed reference users
  const userCount = await db.get('SELECT COUNT(*) as cnt FROM users');
  if (userCount.cnt === 0) {
    console.log('Seeding initial reference users...');
    const defaultPasswordHash = hashPassword('password123');
    const now = new Date().toISOString();

    const seedUsers = [
      {
        id: 'seed-owner-ahmed',
        full_name: 'Ahmed Khan',
        email: 'ahmed@gmail.com',
        postal_code: '75000',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        reputation: 160,
      },
      {
        id: 'seed-owner-sara',
        full_name: 'Sara Ali',
        email: 'sara@gmail.com',
        postal_code: '75000',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        reputation: 140,
      },
      {
        id: 'seed-owner-usman',
        full_name: 'Usman Tariq',
        email: 'usman@gmail.com',
        postal_code: '75000',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        reputation: 120,
      },
      {
        id: 'seed-owner-bilal',
        full_name: 'Bilal Ahmed',
        email: 'bilal@gmail.com',
        postal_code: '75000',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        reputation: 110,
      },
    ];

    for (const u of seedUsers) {
      await db.run(
        `INSERT INTO users (id, full_name, email, password_hash, postal_code, avatar_url, reputation, location_settings, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          u.id,
          u.full_name,
          u.email,
          defaultPasswordHash,
          u.postal_code,
          u.avatar_url,
          u.reputation,
          JSON.stringify({ homeAddress: '', maxDistance: 10, publicLocation: false }),
          '2024-04-10T10:00:00.000Z',
          now,
        ]
      );

      await db.run(
        `INSERT INTO reputation_logs (id, user_id, points, description, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), u.id, 100, 'Joined ToolTrunk Neighbor Network', now]
      );
    }
  }

  // Check if tools exist; if not, seed reference tools
  const toolCount = await db.get('SELECT COUNT(*) as cnt FROM tools');
  if (toolCount.cnt === 0) {
    console.log('Seeding initial reference marketplace tools...');
    const now = new Date().toISOString();

    const seedTools = [
      {
        id: 'tool-cordless-drill-1',
        owner_id: 'seed-owner-ahmed',
        owner_name: 'Ahmed Khan',
        owner_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        name: 'Cordless Drill',
        title: 'Cordless Drill',
        category: 'Power Tools',
        price_per_day: 800,
        rating: 4.8,
        reviews_count: 24,
        distance_km: 2.4,
        postal_code: '75000',
        location: 'Karachi, 75000',
        status: 'available',
        image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80',
        ]),
        description: 'High-performance cordless drill with variable speed and 2 batteries. Perfect for home improvement and DIY projects.',
        features: JSON.stringify([
          '18V Lithium-ion battery',
          '2 speed settings',
          'Includes 2 batteries + charger',
          'Lightweight & portable',
        ]),
      },
      {
        id: 'tool-aluminium-ladder-2',
        owner_id: 'seed-owner-sara',
        owner_name: 'Sara Ali',
        owner_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        name: 'Aluminium Ladder',
        title: 'Aluminium Ladder',
        category: 'Equipment',
        price_per_day: 500,
        rating: 5.0,
        reviews_count: 18,
        distance_km: 1.2,
        postal_code: '75000',
        location: 'Karachi, 75000',
        status: 'available',
        image_url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
        ]),
        description: '12-step multipurpose folding aluminum step ladder. Stable rubber grips, lightweight, supports up to 150kg.',
        features: JSON.stringify([
          'Rust-proof aluminum alloy',
          'Anti-skid rubber feet',
          'Foldable for easy car transport',
          '150 kg max load capacity',
        ]),
      },
      {
        id: 'tool-circular-saw-3',
        owner_id: 'seed-owner-usman',
        owner_name: 'Usman Tariq',
        owner_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        name: 'Circular Saw',
        title: 'Circular Saw',
        category: 'Power Tools',
        price_per_day: 950,
        rating: 4.9,
        reviews_count: 22,
        distance_km: 3.8,
        postal_code: '75000',
        location: 'Karachi, 75000',
        status: 'available',
        image_url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800&auto=format&fit=crop&q=80',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=800&auto=format&fit=crop&q=80',
        ]),
        description: 'Precision electric circular saw with laser guide and carbide-tipped wood blade. Delivers clean, effortless rips and crosscuts.',
        features: JSON.stringify([
          '1400W high-torque motor',
          'Adjustable bevel up to 45 degrees',
          'Dust extraction vacuum port',
          'Blade guard & safety trigger switch',
        ]),
      },
      {
        id: 'tool-toolbox-set-4',
        owner_id: 'seed-owner-bilal',
        owner_name: 'Bilal Ahmed',
        owner_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        name: 'Toolbox Set',
        title: 'Toolbox Set',
        category: 'Hand Tools',
        price_per_day: 400,
        rating: 4.6,
        reviews_count: 11,
        distance_km: 4.1,
        postal_code: '75000',
        location: 'Karachi, 75000',
        status: 'available',
        image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800&auto=format&fit=crop&q=80',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800&auto=format&fit=crop&q=80',
        ]),
        description: 'Complete 108-piece mechanic hand tool kit in a heavy-duty portable toolbox. Sockets, ratchets, wrenches, screwdrivers, and pliers.',
        features: JSON.stringify([
          'Chrome vanadium forged steel',
          'Metric & Imperial socket set',
          'Heavy-duty molded organizer box',
          'Non-slip ergonomic grips',
        ]),
      },
    ];

    for (const t of seedTools) {
      await db.run(
        `INSERT INTO tools (id, owner_id, owner_name, owner_avatar, name, title, category, price_per_day, daily_points, rating, reviews_count, distance_km, postal_code, location, status, image_url, images, description, features, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.owner_id,
          t.owner_name,
          t.owner_avatar,
          t.name,
          t.title,
          t.category,
          t.price_per_day,
          t.price_per_day,
          t.rating,
          t.reviews_count,
          t.distance_km,
          t.postal_code,
          t.location,
          t.status,
          t.image_url,
          t.images,
          t.description,
          t.features,
          now,
          now,
        ]
      );
    }
  }

  // Seed reference bookings to populate Borrower & Owner dashboards if empty
  const bookingCount = await db.get('SELECT COUNT(*) as cnt FROM bookings');
  if (bookingCount.cnt === 0) {
    console.log('Seeding initial reference bookings for dashboard demonstration...');
    const now = new Date().toISOString();

    const seedBookings = [
      {
        id: 'seed-booking-1',
        tool_id: 'tool-cordless-drill-1',
        tool_title: 'Cordless Drill',
        tool_image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
        price_per_day: 800,
        owner_id: 'seed-owner-ahmed',
        owner_name: 'Ahmed Khan',
        borrower_id: 'seed-owner-sara',
        borrower_name: 'Sara Ali',
        borrower_email: 'sara@gmail.com',
        borrower_postal_code: '75000',
        start_date: '2026-09-20',
        end_date: '2026-09-23',
        total_days: 3,
        total_price: 2400,
        status: 'Borrowed',
      },
      {
        id: 'seed-booking-2',
        tool_id: 'tool-aluminium-ladder-2',
        tool_title: 'Aluminium Ladder',
        tool_image: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80',
        price_per_day: 500,
        owner_id: 'seed-owner-sara',
        owner_name: 'Sara Ali',
        borrower_id: 'seed-owner-ahmed',
        borrower_name: 'Ahmed Khan',
        borrower_email: 'ahmed@gmail.com',
        borrower_postal_code: '75000',
        start_date: '2026-09-22',
        end_date: '2026-09-25',
        total_days: 3,
        total_price: 1500,
        status: 'Approved',
      },
      {
        id: 'seed-booking-3',
        tool_id: 'tool-circular-saw-3',
        tool_title: 'Circular Saw',
        tool_image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800&auto=format&fit=crop&q=80',
        price_per_day: 950,
        owner_id: 'seed-owner-usman',
        owner_name: 'Usman Tariq',
        borrower_id: 'seed-owner-ahmed',
        borrower_name: 'Ahmed Khan',
        borrower_email: 'ahmed@gmail.com',
        borrower_postal_code: '75000',
        start_date: '2026-09-28',
        end_date: '2026-09-30',
        total_days: 2,
        total_price: 1900,
        status: 'Pending',
      },
      {
        id: 'seed-booking-4',
        tool_id: 'tool-cordless-drill-1',
        tool_title: 'Cordless Drill',
        tool_image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
        price_per_day: 800,
        owner_id: 'seed-owner-ahmed',
        owner_name: 'Ahmed Khan',
        borrower_id: 'seed-owner-bilal',
        borrower_name: 'Bilal Ahmed',
        borrower_email: 'bilal@gmail.com',
        borrower_postal_code: '75000',
        start_date: '2026-10-05',
        end_date: '2026-10-08',
        total_days: 3,
        total_price: 2400,
        status: 'Pending',
      },
    ];

    for (const b of seedBookings) {
      await db.run(
        `INSERT INTO bookings (id, tool_id, tool_title, tool_image, price_per_day, owner_id, owner_name, borrower_id, borrower_name, borrower_email, borrower_postal_code, start_date, end_date, total_days, total_price, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          b.id,
          b.tool_id,
          b.tool_title,
          b.tool_image,
          b.price_per_day,
          b.owner_id,
          b.owner_name,
          b.borrower_id,
          b.borrower_name,
          b.borrower_email,
          b.borrower_postal_code,
          b.start_date,
          b.end_date,
          b.total_days,
          b.total_price,
          b.status,
          now,
          now,
        ]
      );
    }
  }

  console.log('ToolTrunk relational database ready and seeded!');
}
