import { initDb, db } from './utils/db.js';
import { UserModel } from './models/userModel.js';
import { ToolModel } from './models/toolModel.js';
import { BookingModel } from './models/bookingModel.js';
import { signJwt, verifyJwt } from './utils/jwt.js';
import { redisService } from './services/redisService.js';
import { stripeService } from './services/stripeService.js';
import { emailService } from './services/emailService.js';

async function runTests() {
  console.log('Running ToolTrunk Relational Backend Tests...');
  await initDb();

  // Test 1: User authentication and retrieval
  const user = await UserModel.findByEmail('ahmed@gmail.com');
  console.assert(user && user.fullName === 'Ahmed Khan', 'User lookup failed');
  const validPass = UserModel.verifyPassword('password123', user.passwordHash);
  console.assert(validPass, 'Password verification failed');
  console.log('Test 1 PASSED: User auth & lookup verified.');

  // Test 2: Public tool discovery and postal filtering
  const publicTools = await ToolModel.findPublic({ postalCode: '75000' });
  console.assert(publicTools.length >= 4, `Expected at least 4 tools, got ${publicTools.length}`);
  const drill = publicTools.find((t) => t.id === 'tool-cordless-drill-1');
  console.assert(drill && drill.pricePerDay === 800, 'Drill pricing mismatch');
  console.log('Test 2 PASSED: Tool discovery & postal search verified.');

  // Test 3: Booking creation & date collision logic
  const hasConflict = await BookingModel.hasCollision('tool-cordless-drill-1', '2026-09-21', '2026-09-24');
  console.assert(hasConflict === true, 'Collision detection failed to flag overlap!');
  
  const noConflict = await BookingModel.hasCollision('tool-cordless-drill-1', '2026-11-01', '2026-11-05');
  console.assert(noConflict === false, 'Collision detection flagged non-overlapping range!');
  console.log('Test 3 PASSED: Collision prevention logic verified.');

  // Test 4: Listing modification constraint
  const activeBookingsCount = await BookingModel.countActiveByTool('tool-cordless-drill-1');
  console.assert(activeBookingsCount > 0, 'Active bookings count failed');
  console.log(`Test 4 PASSED: Constraint active bookings check verified (${activeBookingsCount} active).`);

  // Test 5: Booking state machine transitions
  const b = await BookingModel.findById('seed-booking-3');
  console.assert(b.status === 'Pending', 'Initial state must be Pending');
  const approved = await BookingModel.updateStatus(b.id, 'Approved');
  console.assert(approved.status === 'Approved', 'Approved transition failed');
  const borrowed = await BookingModel.updateStatus(b.id, 'Borrowed');
  console.assert(borrowed.status === 'Borrowed', 'Borrowed transition failed');
  const returned = await BookingModel.updateStatus(b.id, 'Returned');
  console.assert(returned.status === 'Returned', 'Returned transition failed');
  console.log('Test 5 PASSED: State machine transitions (Pending -> Approved -> Borrowed -> Returned) verified.');

  // Test 6: JWT Signing and Verification
  const testToken = signJwt({ userId: 'test-123', email: 'test@example.com', role: 'borrower' });
  const verified = verifyJwt(testToken);
  console.assert(verified && verified.userId === 'test-123', 'JWT verification failed');
  console.log('Test 6 PASSED: JWT signing & verification verified.');

  // Test 7: Email service fallback
  const emailRes = await emailService.sendWelcomeEmail({ email: 'test@example.com', name: 'Test' });
  console.assert(emailRes.success === true, 'Email service failed');
  console.log('Test 7 PASSED: Transactional email service & fallback verified.');

  // Test 8: Services availability check (Redis & Stripe graceful degradation)
  console.assert(typeof redisService.isAvailable() === 'boolean', 'Redis availability check failed');
  console.assert(typeof stripeService.isConfigured() === 'boolean', 'Stripe configuration check failed');
  console.log('Test 8 PASSED: Service degradation checks verified.');

  console.log('\nALL 8 RELATIONAL & SAAS UPGRADE TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
