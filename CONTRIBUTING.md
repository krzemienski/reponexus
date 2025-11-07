# Contributing to Repo Nexus

Thank you for your interest in contributing to Repo Nexus! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/reponexus.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit with clear messages
7. Push to your fork
8. Create a Pull Request

## Development Setup

### Frontend
```bash
npm install
npm start
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Code Style

### TypeScript/JavaScript
- Use Prettier for formatting (config in `.prettierrc`)
- Use ESLint for linting (config in `.eslintrc.js`)
- Follow React Native best practices
- Use TypeScript strict mode

### Python
- Use Black for formatting
- Use isort for import sorting
- Use Flake8 for linting
- Follow PEP 8 style guide
- Use type hints

## Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
- `feat(auth): add GitHub OAuth integration`
- `fix(api): resolve repository search pagination issue`
- `docs(readme): update installation instructions`

## Testing

### Frontend
```bash
npm test
npm test -- --coverage
```

### Backend
```bash
pytest
pytest --cov=app
```

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update documentation if you're changing functionality
3. Add tests for new features
4. Ensure all tests pass
5. Update the version numbers if applicable
6. Request review from maintainers

## Pull Request Guidelines

- Keep changes focused and atomic
- Write clear, descriptive PR titles
- Provide detailed description of changes
- Reference related issues
- Include screenshots for UI changes
- Ensure CI/CD passes
- Respond to review feedback promptly

## Code Review

All submissions require review. We use GitHub pull requests for this purpose.

Reviewers will check for:
- Code quality and style
- Test coverage
- Documentation updates
- Performance implications
- Security considerations

## Reporting Bugs

Create an issue with:
- Clear title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
- Screenshots if applicable

## Feature Requests

Create an issue with:
- Clear description
- Use case
- Proposed solution
- Alternative solutions considered

## Community

- Be respectful and inclusive
- Follow the code of conduct
- Help others learn and grow
- Give constructive feedback

## Questions?

Feel free to create an issue for questions or reach out to maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
