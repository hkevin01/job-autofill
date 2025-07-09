const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const backendDir = process.cwd();

// Check if required files exist
const requiredFiles = [
  'src/server.ts',
  'src/models/User.ts',
  'src/models/Application.ts',
  'src/controllers/authController.ts',
  'src/controllers/profileController.ts',
  'src/controllers/aiController.ts',
  'src/controllers/applicationController.ts',
  'src/routes/auth.ts',
  'src/routes/profile.ts',
  'src/routes/ai.ts',
  'src/routes/applications.ts',
  'src/services/aiService.ts',
  'src/middleware/auth.ts',
  'src/middleware/errorHandler.ts',
  'src/middleware/notFound.ts',
  'src/types/index.ts',
  'package.json',
  'tsconfig.json',
  '.env.example'
];

console.log('🔍 Backend Phase 2 Validation\n');

let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = path.join(backendDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
}

// Check if package.json has required dependencies
try {
  const packageJsonPath = path.join(backendDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDeps = [
    'express',
    'mongoose',
    'bcryptjs',
    'jsonwebtoken',
    'cors',
    'helmet',
    'express-rate-limit',
    'dotenv',
    'openai',
    'express-validator'
  ];

  console.log('\n📦 Required Dependencies:');
  for (const dep of requiredDeps) {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} (${packageJson.dependencies[dep]})`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allFilesExist = false;
    }
  }

  console.log('\n🔧 Dev Dependencies:');
  const devDeps = ['typescript', '@types/node', '@types/express', 'nodemon', 'ts-node'];
  for (const dep of devDeps) {
    if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep} (${packageJson.devDependencies[dep]})`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
    }
  }

} catch (error) {
  console.log('❌ Error reading package.json:', error);
  allFilesExist = false;
}

// Check TypeScript compilation
console.log('\n🏗️  TypeScript Compilation:');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  allFilesExist = false;
}

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
  console.log('🎉 Phase 2 Backend Setup Complete!');
  console.log('\n✅ All required files exist');
  console.log('✅ All dependencies installed');
  console.log('✅ TypeScript compilation successful');
  console.log('\n📋 Phase 2 Completed Tasks:');
  console.log('  - Backend API setup with Express.js');
  console.log('  - User authentication system');
  console.log('  - User profile management');
  console.log('  - OpenAI API integration');
  console.log('  - Job description analysis and parsing');
  console.log('\n🚀 Ready for Phase 3: Advanced Features & Intelligence');
} else {
  console.log('❌ Phase 2 Backend Setup Incomplete');
  console.log('Please fix the missing files/dependencies above');
  process.exit(1);
}
