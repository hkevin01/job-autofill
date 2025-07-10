// Test Configuration for Job AutoFill Extension
import { jest } from '@jest/globals';

// Mock Chrome APIs
global.chrome = {
  runtime: {
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    sendMessage: jest.fn(),
    getManifest: jest.fn(() => ({
      version: '1.0.0',
      name: 'Job AutoFill Test',
    })),
  },
  storage: {
    sync: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
    },
    local: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
      remove: jest.fn(() => Promise.resolve()),
    },
  },
  tabs: {
    query: jest.fn(() => Promise.resolve([{ id: 1, url: 'https://example.com' }])),
    sendMessage: jest.fn(() => Promise.resolve({ success: true })),
    create: jest.fn(() => Promise.resolve({ id: 2 })),
  },
  permissions: {
    request: jest.fn(() => Promise.resolve(true)),
    contains: jest.fn(() => Promise.resolve(true)),
  },
};

// Mock DOM APIs
Object.defineProperty(window, 'navigator', {
  value: {
    mediaDevices: {
      getUserMedia: jest.fn(() => Promise.resolve({})),
      enumerateDevices: jest.fn(() => Promise.resolve([])),
    },
  },
  writable: true,
});

// Mock Fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} }),
    text: () => Promise.resolve(''),
  })
);

// Test helpers
export const mockTab = {
  id: 1,
  url: 'https://jobs.example.com/apply',
  title: 'Software Engineer - Example Corp',
};

export const mockUserProfile = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    country: 'USA',
  },
  experience: [
    {
      company: 'Tech Corp',
      position: 'Software Engineer',
      startDate: '2022-01-01',
      endDate: '2024-01-01',
      description: 'Developed web applications using React and Node.js',
    },
  ],
  education: [
    {
      institution: 'University of Technology',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      graduationDate: '2021-12-01',
    },
  ],
  skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
  preferences: {
    jobTypes: ['Full-time', 'Remote'],
    industries: ['Technology', 'Software'],
    locations: ['San Francisco', 'Remote'],
    salaryRange: { min: 80000, max: 120000 },
    remote: true,
  },
};

export const mockJobDetails = {
  title: 'Senior Software Engineer',
  company: 'Example Corp',
  description: 'We are looking for a skilled software engineer with experience in React and Node.js...',
  url: 'https://jobs.example.com/apply/123',
  requirements: ['React', 'Node.js', 'TypeScript', '3+ years experience'],
};

export const mockApiResponse = {
  success: true,
  data: {
    analysis: {
      skillMatch: {
        score: 85,
        matchedSkills: ['JavaScript', 'React', 'Node.js'],
        missingSkills: ['Python', 'AWS'],
      },
      fitScore: 85,
      recommendations: {
        strengths: ['Strong frontend experience', 'Full-stack capabilities'],
        improvements: ['Add cloud computing skills', 'Highlight leadership experience'],
      },
    },
  },
};

// Utility functions for tests
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const createMockElement = (tagName, attributes = {}) => {
  const element = document.createElement(tagName);
  Object.assign(element, attributes);
  return element;
};

export const simulateUserInput = (element, value) => {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
};

export const simulateClick = (element) => {
  element.dispatchEvent(new Event('click', { bubbles: true }));
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
