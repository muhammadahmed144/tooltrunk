export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'ToolTrunk REST API',
    version: '1.0.0',
    description: 'Production-ready REST API for ToolTrunk — Neighborhood Tool Sharing & Rental Platform.',
    contact: {
      name: 'ToolTrunk Support',
      email: 'support@tooltrunk.local',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          postalCode: { type: 'string' },
          reputation: { type: 'integer' },
          avatarUrl: { type: 'string' },
        },
      },
      Tool: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          ownerId: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
          pricePerDay: { type: 'number' },
          postalCode: { type: 'string' },
          status: { type: 'string', enum: ['available', 'borrowed'] },
          imageUrl: { type: 'string' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          toolId: { type: 'string' },
          ownerId: { type: 'string' },
          borrowerId: { type: 'string' },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          totalDays: { type: 'integer' },
          totalPrice: { type: 'number' },
          status: { type: 'string', enum: ['Pending', 'Approved', 'Rejected', 'Borrowed', 'Returned'] },
          paymentStatus: { type: 'string', enum: ['Unpaid', 'Paid', 'Refunded'] },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health Check',
        responses: {
          200: {
            description: 'API is running smoothly',
          },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new neighbor account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password', 'postalCode'],
                properties: {
                  fullName: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  postalCode: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Account registered successfully' },
          400: { description: 'Validation error' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate and receive JWT token + HTTP-only session cookie',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Clear HTTP-only session cookie',
        responses: {
          200: { description: 'Logged out successfully' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Current user profile data' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/tools/public': {
      get: {
        summary: 'List available tools with optional filters (search, category, postalCode)',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'postalCode', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List of tools' },
        },
      },
    },
    '/tools/public/{id}': {
      get: {
        summary: 'Get tool details by ID (Guest view hides sensitive owner details)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Tool details' },
          404: { description: 'Tool not found' },
        },
      },
    },
    '/tools': {
      get: {
        summary: 'Get tools belonging to the authenticated owner',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'List of owner tools' },
        },
      },
      post: {
        summary: 'Create a new tool listing',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          201: { description: 'Tool created' },
          400: { description: 'Validation error' },
        },
      },
    },
    '/bookings': {
      post: {
        summary: 'Submit a new rental booking request (enforces date math & collision prevention)',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          201: { description: 'Booking request created' },
          409: { description: 'Date collision conflict' },
        },
      },
    },
    '/bookings/borrower': {
      get: {
        summary: 'Get all rental bookings requested by the authenticated borrower',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'List of borrower bookings' },
        },
      },
    },
    '/bookings/owner': {
      get: {
        summary: 'Get all booking requests for tools owned by the authenticated user',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'List of owner bookings' },
        },
      },
    },
    '/bookings/{id}/status': {
      patch: {
        summary: 'Transition booking state (Pending -> Approved/Rejected -> Borrowed -> Returned)',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Booking status updated' },
        },
      },
    },
    '/payments/create-checkout-session': {
      post: {
        summary: 'Create a Stripe Checkout Session for a rental booking',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Stripe Checkout Session URL' },
          400: { description: 'Invalid booking or payment error' },
        },
      },
    },
    '/upload/tool-image': {
      post: {
        summary: 'Upload a tool image to Cloudinary (Multipart)',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: 'Cloudinary image URL and publicId' },
        },
      },
    },
  },
};
