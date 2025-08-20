# Contributing to Job AutoFill

First off, thank you for considering contributing to Job AutoFill! 🎉

It's people like you that make Job AutoFill such a great tool for job seekers
everywhere.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Adding Job Site Support](#adding-job-site-support)
  - [Code Contributions](#code-contributions)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Community Guidelines](#community-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our Code of
Conduct. By participating, you are expected to uphold this code. Please report
unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find
out that you don't need to create one. When you are creating a bug report,
please include as many details as possible using our bug report template.

**Good Bug Reports** include:

- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots or GIFs when applicable
- Browser and extension version information
- Console logs or error messages

### Suggesting Features

Feature suggestions are welcome! Please use our feature request template and
provide:

- Clear description of the feature
- Use cases and benefits
- Mockups or examples if possible
- Consideration of alternatives

### Adding Job Site Support

One of the most valuable contributions is adding support for new job boards and
ATS platforms:

1. **Research the Platform**: Study the job application flow
2. **Create Issue**: Use our job site support template
3. **Implement Detection**: Add form detection logic
4. **Add Field Mapping**: Map form fields to our data model
5. **Test Thoroughly**: Ensure reliable form filling
6. **Document**: Add platform-specific notes

### Code Contributions

We welcome code contributions! Areas where help is especially appreciated:

- Bug fixes
- New job site integrations
- UI/UX improvements
- Performance optimizations
- Test coverage improvements
- Documentation updates

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for backend development)
- Chrome browser (for extension testing)

### Setup Steps

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/job-autofill.git
   cd job-autofill
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp extension/.env.example extension/.env

   # Edit the files with your configuration
   ```

4. **Start Development Environment**

   ```bash
   # Start backend services with Docker
   docker-compose up -d

   # Start backend in development mode
   npm run dev:backend

   # Build extension for development
   npm run build:extension
   ```

5. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/dist` folder

### Project Structure

```
job-autofill/
├── backend/          # Node.js/Express API
├── extension/        # Chrome Extension
├── docs/            # Documentation
├── scripts/         # Build and utility scripts
├── tests/           # E2E and integration tests
└── assets/          # Shared assets
```

## Coding Standards

### General Guidelines

- **Code Quality**: Write clean, readable, and maintainable code
- **Testing**: Include tests for new functionality
- **Documentation**: Document complex logic and APIs
- **Performance**: Consider performance implications
- **Security**: Follow security best practices

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow our ESLint and Prettier configurations
- Use meaningful variable and function names
- Prefer `const` over `let`, avoid `var`
- Use async/await over promises when possible

### Code Style

- 2 spaces for indentation
- Single quotes for strings
- Trailing commas in multi-line structures
- Max line length: 100 characters

### Testing

- Write unit tests for utility functions
- Write integration tests for API endpoints
- Write E2E tests for critical user flows
- Aim for good test coverage

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/)
specification:

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(extension): add support for Workday ATS
fix(backend): resolve authentication token expiration
docs(api): update authentication endpoint documentation
test(e2e): add tests for LinkedIn job application flow
```

## Pull Request Process

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make Changes**

   - Follow coding standards
   - Include tests
   - Update documentation

3. **Test Your Changes**

   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

4. **Commit Changes**

   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request through GitHub.

### PR Requirements

- [ ] Clear description of changes
- [ ] Link to related issue(s)
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated if needed
- [ ] Screenshots for UI changes

## Community Guidelines

### Being Respectful

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community

### Getting Help

- Check existing documentation first
- Search existing issues before creating new ones
- Use appropriate issue templates
- Be patient and constructive in discussions

### Recognition

Contributors will be recognized in:

- README contributors section
- Release notes for significant contributions
- Special recognition for major features

## Development Tips

### Extension Development

- Use `npm run dev:extension` for hot reloading
- Test on multiple job sites regularly
- Check browser console for errors
- Use Chrome DevTools for debugging content scripts

### Backend Development

- Use `npm run dev:backend` for auto-restart
- Check API responses with tools like Postman
- Monitor logs for errors and performance
- Use MongoDB Compass for database inspection

### Debugging

- Enable verbose logging in development
- Use browser DevTools extensively
- Test edge cases and error conditions
- Verify functionality across different browsers

## Questions?

If you have questions about contributing, feel free to:

- Open a discussion on GitHub
- Comment on relevant issues
- Reach out to maintainers

Thank you for contributing to Job AutoFill! 🚀
