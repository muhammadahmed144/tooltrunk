import { initDb, db, hashPassword, verifyPassword } from './utils/db.js';
import { UserModel } from './models/userModel.js';
import { ToolModel } from './models/toolModel.js';
import { BookingModel } from './models/bookingModel.js';
import { ToolController } from './controllers/toolController.js';
import { BookingController } from './controllers/bookingController.js';
import { AuthController } from './controllers/authController.js';
import { signJwt } from './utils/jwt.js';

function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

async function runSrsAuditTests() {
  console.log('====================================================');
  console.log('  STARTING TOOLTRUNK OFFICIAL SRS COMPLIANCE TESTS  ');
  console.log('====================================================\n');

  await initDb();

  // Test suite stats
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      failed++;
      throw new Error(message);
    } else {
      console.log(`✅ PASSED: ${message}`);
      passed++;
    }
  }

  // -----------------------------------------------------------------
  // 1. USER REGISTRATION & AUTHENTICATION (SRS Sec 3.1)
  // Required fields: Full Name, Email, Password, Postal Code
  // -----------------------------------------------------------------
  console.log('\n--- 1. USER MANAGEMENT & AUTHENTICATION ---');
  
  // Registration missing postal code should fail
  let req = { body: { fullName: 'Test User', email: 'test_nopc@test.com', password: 'password123' } };
  let res = createMockRes();
  await AuthController.register(req, res);
  assert(res.statusCode === 400 && res.data.error.includes('postal code'), 'Registration requires Postal Code');

  // Registration missing full name should fail
  req = { body: { fullName: '', email: 'test_noname@test.com', password: 'password123', postalCode: '75000' } };
  res = createMockRes();
  await AuthController.register(req, res);
  assert(res.statusCode === 400 && res.data.error.includes('full name'), 'Registration requires Full Name');

  // Successful registration with all SRS fields
  const uniqueEmail = `borrower_${Date.now()}@test.com`;
  req = { body: { fullName: 'Tariq Borrower', email: uniqueEmail, password: 'securePass123', postalCode: '75000' } };
  res = createMockRes();
  await AuthController.register(req, res);
  assert(res.statusCode === 201 && res.data.token && res.data.user.postalCode === '75000', 'Registration succeeds with Full Name, Email, Password, Postal Code');
  const borrowerId = res.data.user.id;
  const borrowerToken = res.data.token;

  // Password hashing: Password must never be stored as plaintext
  const dbUser = await UserModel.findById(borrowerId);
  assert(dbUser.passwordHash !== 'securePass123', 'Password is never stored in plaintext');
  assert(verifyPassword('securePass123', dbUser.passwordHash), 'Password hash verified via scrypt');

  // -----------------------------------------------------------------
  // 2. GUEST PRIVACY & ROLE PERMISSIONS (SRS Sec 2 & 3.2)
  // Guests cannot view owner details or request tools
  // -----------------------------------------------------------------
  console.log('\n--- 2. GUEST PRIVACY & ACCESS CONTROL ---');

  // Find an existing tool to test
  const existingTools = await ToolModel.findPublic();
  const sampleTool = existingTools[0];

  // Guest requests tool details (No authorization header)
  req = { params: { id: sampleTool.id }, headers: {} };
  res = createMockRes();
  await ToolController.getToolById(req, res);
  assert(res.statusCode === 200, 'Guest can view tool listing');
  assert(res.data.tool.owner === null, 'Owner details are strictly hidden from Guest users');
  assert(res.data.tool.isGuest === true, 'Response flags unauthenticated guest status');

  // Authenticated user requests tool details (With bearer token)
  req = { params: { id: sampleTool.id }, headers: { authorization: `Bearer ${borrowerToken}` } };
  res = createMockRes();
  await ToolController.getToolById(req, res);
  assert(res.statusCode === 200, 'Authenticated user can view tool details');
  assert(res.data.tool.owner !== null && res.data.tool.owner.name, 'Owner details visible to authenticated community members');

  // -----------------------------------------------------------------
  // 3. TOOL LISTING MANAGEMENT (CRUD) & OWNER AUTHORIZATION (SRS Sec 3.2)
  // Full CRUD: Create, Read, Update, Delete. Owner only.
  // -----------------------------------------------------------------
  console.log('\n--- 3. TOOL LISTING MANAGEMENT (CRUD) ---');

  // Create tool as an owner
  const ownerEmail = `owner_${Date.now()}@test.com`;
  const ownerReg = { body: { fullName: 'Bilal Owner', email: ownerEmail, password: 'password123', postalCode: '75000' } };
  const ownerRes = createMockRes();
  await AuthController.register(ownerReg, ownerRes);
  const ownerId = ownerRes.data.user.id;
  const ownerToken = ownerRes.data.token;

  req = {
    user: { userId: ownerId },
    body: {
      name: 'High Precision Mitre Saw',
      title: 'High Precision Mitre Saw',
      category: 'Power Tools',
      pricePerDay: 1200,
      description: 'Clean cutting heavy duty mitre saw for woodworking.',
      postalCode: '75000',
    },
  };
  res = createMockRes();
  await ToolController.createTool(req, res);
  assert(res.statusCode === 201 && res.data.tool.name === 'High Precision Mitre Saw', 'Owner can create tool listing');
  const createdToolId = res.data.tool.id;

  // Another user (borrower) cannot update owner's tool
  req = {
    user: { userId: borrowerId },
    params: { id: createdToolId },
    body: { name: 'Hacked Tool Name' },
  };
  res = createMockRes();
  await ToolController.updateTool(req, res);
  assert(res.statusCode === 403, 'Unauthorized user cannot edit another owner listing');

  // Owner can update their own tool
  req = {
    user: { userId: ownerId },
    params: { id: createdToolId },
    body: { pricePerDay: 1300 },
  };
  res = createMockRes();
  await ToolController.updateTool(req, res);
  assert(res.statusCode === 200 && res.data.tool.pricePerDay === 1300, 'Owner can successfully update their listing');

  // -----------------------------------------------------------------
  // 4. BOOKING ENGINE & DATE VALIDATION (SRS Sec 3.3)
  // Reject past dates, reject end <= start, calculate exact duration
  // -----------------------------------------------------------------
  console.log('\n--- 4. BOOKING ENGINE & DATE VALIDATION ---');

  // Reject past date
  req = {
    user: { userId: borrowerId },
    body: { toolId: createdToolId, startDate: '2020-01-01', endDate: '2020-01-05' },
  };
  res = createMockRes();
  await BookingController.createBooking(req, res);
  assert(res.statusCode === 400 && res.data.error.includes('past'), 'Backend rejects past rental start date');

  // Reject end date <= start date
  req = {
    user: { userId: borrowerId },
    body: { toolId: createdToolId, startDate: '2027-06-10', endDate: '2027-06-10' },
  };
  res = createMockRes();
  await BookingController.createBooking(req, res);
  assert(res.statusCode === 400 && res.data.error.includes('after'), 'Backend rejects end date equal to or before start date');

  // Owner cannot book their own tool
  req = {
    user: { userId: ownerId },
    body: { toolId: createdToolId, startDate: '2027-06-10', endDate: '2027-06-13' },
  };
  res = createMockRes();
  await BookingController.createBooking(req, res);
  assert(res.statusCode === 400 && res.data.error.includes('own tool'), 'Owner cannot book their own tool');

  // -----------------------------------------------------------------
  // 5. PRICE CALCULATION FORMULA (SRS Sec 3.3, Prompt Sec 9)
  // Total Price = Price Per Day * (End Date - Start Date)
  // Example: 1000 * (June 13 - June 10) = 3000
  // -----------------------------------------------------------------
  console.log('\n--- 5. EXACT PRICE CALCULATION FORMULA ---');

  req = {
    user: { userId: borrowerId },
    body: {
      toolId: createdToolId, // Price is 1300
      startDate: '2027-06-10',
      endDate: '2027-06-13', // Duration: exactly 3 days
    },
  };
  res = createMockRes();
  await BookingController.createBooking(req, res);
  assert(res.statusCode === 201, 'Valid rental booking created');
  const booking1 = res.data.booking;
  assert(booking1.totalDays === 3, 'Rental duration is exactly (End Date - Start Date) = 3 days');
  assert(booking1.totalPrice === 1300 * 3, 'Total price verified server-side: 1300 * 3 = 3900');
  assert(booking1.status === 'Pending', 'Initial state is Pending');

  // -----------------------------------------------------------------
  // 6. DOUBLE-BOOKING & COLLISION LOGIC (SRS Sec 3.3, Prompt Sec 8)
  // Prevent overlapping bookings server-side
  // -----------------------------------------------------------------
  console.log('\n--- 6. DOUBLE-BOOKING COLLISION ENGINE ---');

  // Overlapping request for same dates: June 11 to June 14
  req = {
    user: { userId: borrowerId },
    body: {
      toolId: createdToolId,
      startDate: '2027-06-11',
      endDate: '2027-06-14',
    },
  };
  res = createMockRes();
  await BookingController.createBooking(req, res);
  assert(res.statusCode === 409, 'Server-side collision engine strictly blocks overlapping booking request (409)');

  // Non-overlapping request: July 01 to July 05
  req = {
    user: { userId: borrowerId },
    body: {
      toolId: createdToolId,
      startDate: '2027-07-01',
      endDate: '2027-07-05',
    },
  };
  res = createMockRes();
  await BookingController.createBooking(req, res);
  assert(res.statusCode === 201, 'Non-overlapping future booking successfully accepted');
  const bookingNonOverlap = res.data.booking;

  // -----------------------------------------------------------------
  // 7. LISTING MODIFICATION & DELETION CONSTRAINTS (SRS Sec 3.2, Prompt Sec 5)
  // Tool listing MUST NOT be edited or deleted with active or pending booking
  // -----------------------------------------------------------------
  console.log('\n--- 7. LISTING MODIFICATION & DELETION CONSTRAINTS ---');

  // Attempt to edit tool while booking1 is Pending
  req = {
    user: { userId: ownerId },
    params: { id: createdToolId },
    body: { name: 'Attempted Name Change' },
  };
  res = createMockRes();
  await ToolController.updateTool(req, res);
  assert(res.statusCode === 400 && res.data.error.includes('active or pending bookings'), 'Tool modification strictly blocked when pending booking exists');

  // Attempt to delete tool while booking1 is Pending
  req = {
    user: { userId: ownerId },
    params: { id: createdToolId },
  };
  res = createMockRes();
  await ToolController.deleteTool(req, res);
  assert(res.statusCode === 400 && res.data.error.includes('active or pending bookings'), 'Tool deletion strictly blocked when pending booking exists');

  // -----------------------------------------------------------------
  // 8. BOOKING WORKFLOW STATE MACHINE (SRS Sec 3.4, Prompt Sec 10, 11)
  // Pending -> Approved -> Borrowed -> Returned
  // Restricted state transitions & authorization
  // -----------------------------------------------------------------
  console.log('\n--- 8. BOOKING WORKFLOW STATE MACHINE ---');

  // Borrower tries to approve their own booking -> MUST BE BLOCKED
  req = {
    user: { userId: borrowerId },
    params: { id: booking1.id },
    body: { status: 'Approved' },
  };
  res = createMockRes();
  await BookingController.updateStatus(req, res);
  assert(res.statusCode === 403, 'Borrower cannot approve their own booking (403 Forbidden)');

  // Owner approves booking -> Pending -> Approved
  req = {
    user: { userId: ownerId },
    params: { id: booking1.id },
    body: { status: 'Approved' },
  };
  res = createMockRes();
  await BookingController.updateStatus(req, res);
  assert(res.statusCode === 200 && res.data.booking.status === 'Approved', 'Owner successfully approves booking (Pending -> Approved)');

  // Invalid transition: Approved -> Returned directly must be blocked
  req = {
    user: { userId: ownerId },
    params: { id: booking1.id },
    body: { status: 'Returned' },
  };
  res = createMockRes();
  await BookingController.updateStatus(req, res);
  assert(res.statusCode === 400, 'Invalid state transition blocked: Approved -> Returned is not allowed');

  // Physical Handover: Owner selects "Confirm Handover" -> Approved -> Borrowed
  req = {
    user: { userId: ownerId },
    params: { id: booking1.id },
    body: { status: 'Borrowed' },
  };
  res = createMockRes();
  await BookingController.updateStatus(req, res);
  assert(res.statusCode === 200 && res.data.booking.status === 'Borrowed', 'Physical handover confirmed by Owner (Approved -> Borrowed)');

  // While Borrowed (Active rental), tool still cannot be modified or deleted
  req = {
    user: { userId: ownerId },
    params: { id: createdToolId },
  };
  res = createMockRes();
  await ToolController.deleteTool(req, res);
  assert(res.statusCode === 400 && res.data.error.includes('active or pending bookings'), 'Tool deletion blocked during active (Borrowed) rental');

  // Return: Owner selects "Mark as Returned" -> Borrowed -> Returned
  req = {
    user: { userId: ownerId },
    params: { id: booking1.id },
    body: { status: 'Returned' },
  };
  res = createMockRes();
  await BookingController.updateStatus(req, res);
  assert(res.statusCode === 200 && res.data.booking.status === 'Returned', 'Tool marked as Returned by Owner (Borrowed -> Returned)');

  // Terminal state: Cannot transition once Returned
  req = {
    user: { userId: ownerId },
    params: { id: booking1.id },
    body: { status: 'Borrowed' },
  };
  res = createMockRes();
  await BookingController.updateStatus(req, res);
  assert(res.statusCode === 400, 'Terminal state protection: Returned booking cannot be re-opened without a new booking');

  // -----------------------------------------------------------------
  // 9. LOCAL DISCOVERY (SRS Sec 3.2, Prompt Sec 6)
  // Postal code filtering
  // -----------------------------------------------------------------
  console.log('\n--- 9. LOCAL DISCOVERY & POSTAL CODE FILTERING ---');

  req = { query: { postalCode: '75000' }, headers: {} };
  res = createMockRes();
  await ToolController.getPublicTools(req, res);
  assert(res.statusCode === 200, 'Postal code discovery returns 200');
  const matchingTools = res.data.tools.filter((t) => t.postalCode === '75000');
  assert(matchingTools.length > 0, 'Discovery feed filters tools by postal code');

  // Search non-existent postal code
  req = { query: { postalCode: '99999' }, headers: {} };
  res = createMockRes();
  await ToolController.getPublicTools(req, res);
  assert(res.statusCode === 200 && res.data.tools.length === 0, 'Non-existent postal code returns empty list');

  console.log('\n====================================================');
  console.log(`  ALL SRS COMPLIANCE TESTS FINISHED!`);
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  console.log('====================================================\n');
  process.exit(0);
}

runSrsAuditTests().catch((err) => {
  console.error('\n❌ FATAL AUDIT ERROR:', err);
  process.exit(1);
});
