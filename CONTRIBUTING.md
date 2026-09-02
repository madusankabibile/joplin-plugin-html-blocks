# Contributing to Joplin Plugin: HTML Blocks

First off, thank you for considering contributing to the HTML Blocks plugin for Joplin! It's people like you that make open-source tools better for everyone.

The following is a set of guidelines for contributing to `joplin-plugin-html-blocks`, which is hosted on GitHub. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Table of Contents

* [Code of Conduct](#code-of-conduct)
* [How Can I Contribute?](#how-can-i-contribute)
  * [Reporting Bugs](#reporting-bugs)
  * [Suggesting Enhancements](#suggesting-enhancements)
  * [Pull Requests](#pull-requests)
* [Local Development Setup](#local-development-setup)
* [Styleguides](#styleguides)

## Code of Conduct

This project and everyone participating in it is governed by a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the repository maintainer.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to see if the problem has already been reported. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title.
* Describe the exact steps to reproduce the problem.
* Provide specific examples to demonstrate the steps.
* Describe the behavior you observed after following the steps and point out exactly what the problem is.
* Explain which behavior you expected to see instead and why.
* Include the version of Joplin and the version of this plugin you are using.
* Include your operating system details.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please provide the following details:

* Use a clear and descriptive title.
* Provide a step-by-step description of the suggested enhancement in as many details as possible.
* Explain why this enhancement would be useful to most users.
* You may also provide mockups or visual representations if applicable.

### Pull Requests

* Fill in the provided Pull Request template if one exists.
* Ensure any install or build dependencies are removed before the end of the layer when doing a build.
* Update the README.md with details of changes to the interface, new variables, or useful information.
* The pull request will be merged once you have the sign-off of the maintainer.

## Local Development Setup

To set up the project locally for development, follow these steps:

1. **Prerequisites:** Make sure you have Node.js and npm (or yarn) installed. You will also need the Joplin desktop application installed to test the plugin.
2. **Clone the repository:**
   ```bash
   git clone https://github.com/madusankabibile/joplin-plugin-html-blocks.git
   cd joplin-plugin-html-blocks
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Build the plugin:**
   ```bash
   npm run dist
   ```
   This will compile the TypeScript code and generate a `.jpl` file which can be used to install the plugin.
5. **Testing in Joplin:**
   * Open Joplin.
   * Go to `Tools > Options > Plugins` (or `Joplin > Settings > Plugins` on macOS).
   * Expand the "Advanced Tools" section and add the path to your cloned repository under "Development plugins".
   * Restart Joplin to load the development plugin.

## Styleguides

### Commit Messages

* Use the present tense ("Add feature" not "Added feature").
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...").
* Limit the first line to 72 characters or less.
* Reference issues and pull requests liberally after the first line.
