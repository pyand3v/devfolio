# Contributing to devfolio

Thank you for your interest in contributing to devfolio, a multilingual Astro developer portfolio!
We welcome contributions from the community to help improve and enhance it.
This document outlines the guidelines and steps for contributing.

---

## Getting Started

To get started, follow the steps below.

### Prerequisites

- Ensure you have [Node.js](https://nodejs.org/) 24 and [pnpm](https://pnpm.io/) 11 installed on your machine.
- Familiarity with Git and GitHub is recommended, as well as [Git](https://git-scm.com/) installed locally.
- Knowledge of Astro, TypeScript, Tailwind CSS, and MDX will be helpful, since this project is built using these technologies.

### Fork and Clone the Repository

1. Fork the repository on GitHub by clicking the "Fork" button at the top right of the repository page.
2. Clone your forked repository to your local machine using the following command:
   ```bash
   git clone https://github.com/YOUR-USERNAME/devfolio.git
   cd devfolio
   ```
3. Add the original repository as a remote to keep your fork up to date:
   ```bash
   git remote add upstream https://github.com/pyand3v/devfolio.git
   ```
4. Create a new branch for your feature, bug fix, or whatever you want to work on:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. Make your changes in your local repository, commit them, and then push to your forked repository, e.g.:
   ```bash
   git add .
   git commit -m "Add your commit message here"
   git push origin feature/your-feature-name
   ```
6. Make sure your changes pass the same checks CI runs before submitting a pull request:
   ```bash
   pnpm format:check && pnpm lint:check && pnpm types:check && pnpm test && pnpm build
   ```
7. Open a pull request from your forked repository against the `preview` branch (the default). `main` is
   production and only accepts promotions from `preview`, so PRs targeting it are rejected by CI.
8. Describe your changes in detail in the pull request description (fill in the PR template).
9. Wait for feedback and make any requested changes. Every PR runs the checks above, gets a Vercel preview
   deployment, and (unless it only touches content or docs) gets an automated review from Claude. Maintainers can also comment `@claude` on a PR or
   issue to ask Claude a question or have it push a fix.

### Development Environment Setup

To set up your development environment after cloning the repository, follow these steps:

1. Install the necessary dependencies by running:
   ```bash
   pnpm install
   ```
2. Start the development server with:
   ```bash
   pnpm dev
   ```
3. Open your browser and navigate to `http://localhost:4321` to view the website, and start making changes. The server
   will automatically reload when you make changes to the code, so you can see your updates in real-time.

## Code Style and Guidelines

- Follow the existing code style and conventions used in the project. [AGENTS.md](AGENTS.md) documents the
  project layout, commands, and conventions (it's also what AI coding agents such as Claude Code read).
- Write clear, concise, and descriptive commit messages.
- Ensure your code is well-documented and includes comments where necessary (do not over-do it, though).

## Need Help?

If you have any questions or need assistance, feel free to open an issue on the GitHub repository using
the issue template provided. To report a security vulnerability, follow [SECURITY.md](SECURITY.md) instead
of opening a public issue.
