// MongoDB initialization script for Job AutoFill
// This script sets up the initial database structure and indexes

// Connect to the jobautofill database
db = db.getSiblingDB('jobautofill');

// Create collections with validation schemas
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'createdAt'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Must be a valid email address',
        },
        password: {
          bsonType: 'string',
          minLength: 60,
          maxLength: 60,
          description: 'Must be a bcrypt hashed password',
        },
        profile: {
          bsonType: 'object',
          properties: {
            firstName: { bsonType: 'string' },
            lastName: { bsonType: 'string' },
            phone: { bsonType: 'string' },
            address: { bsonType: 'string' },
            summary: { bsonType: 'string' },
            skills: { bsonType: 'array' },
            experience: { bsonType: 'array' },
            education: { bsonType: 'array' },
          },
        },
        preferences: {
          bsonType: 'object',
          properties: {
            autoFill: { bsonType: 'bool' },
            notifications: { bsonType: 'bool' },
            theme: { enum: ['light', 'dark', 'auto'] },
          },
        },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
        lastLoginAt: { bsonType: 'date' },
      },
    },
  },
});

db.createCollection('applications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'jobTitle', 'company', 'status', 'createdAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        jobTitle: { bsonType: 'string' },
        company: { bsonType: 'string' },
        jobUrl: { bsonType: 'string' },
        status: {
          enum: ['applied', 'interviewing', 'rejected', 'offered', 'withdrawn'],
        },
        appliedAt: { bsonType: 'date' },
        formData: { bsonType: 'object' },
        notes: { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
});

db.createCollection('templates', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'name', 'fields', 'createdAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        fields: { bsonType: 'object' },
        isDefault: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
      },
    },
  },
});

// Create indexes for better performance
print('Creating indexes for users collection...');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });
db.users.createIndex({ updatedAt: 1 });

print('Creating indexes for applications collection...');
db.applications.createIndex({ userId: 1 });
db.applications.createIndex({ userId: 1, createdAt: -1 });
db.applications.createIndex({ status: 1 });
db.applications.createIndex({ company: 1 });
db.applications.createIndex({ appliedAt: -1 });

print('Creating indexes for templates collection...');
db.templates.createIndex({ userId: 1 });
db.templates.createIndex({ userId: 1, name: 1 }, { unique: true });
db.templates.createIndex({ isDefault: 1 });

// Create a development user (only in development environment)
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  print('Creating development user...');

  db.users.insertOne({
    email: 'dev@jobautofill.com',
    password: '$2b$10$K8QKZKZKZKZKZKZKZKZKZu', // placeholder - should be actual bcrypt hash
    profile: {
      firstName: 'Developer',
      lastName: 'User',
      phone: '+1-555-0123',
      address: '123 Dev Street, Code City, CC 12345',
      summary: 'Full-stack developer with experience in modern web technologies.',
      skills: ['JavaScript', 'TypeScript', 'Node.js', 'React', 'MongoDB'],
      experience: [],
      education: [],
    },
    preferences: {
      autoFill: true,
      notifications: true,
      theme: 'dark',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

print('Database initialization completed successfully!');
print('Created collections: users, applications, templates');
print('Created indexes for optimal performance');

// Show collection stats
print('\nCollection statistics:');
print('Users: ' + db.users.countDocuments());
print('Applications: ' + db.applications.countDocuments());
print('Templates: ' + db.templates.countDocuments());
