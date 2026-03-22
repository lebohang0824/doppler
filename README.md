# AI-Powered Issue Manager

This project is a local web application designed to help developers manage software issues. It leverages Google's Gemini CLI/Opencode CLI to offer automated issue resolution, integrating directly with local Git repositories to modify code, create reports, and manage changes.

The application is built with Astro for both frontend and backend logic, with UI interactivity powered by Alpine.js.

## Core Workflow

The application follows a specific workflow for managing issues from creation to resolution:

1.  **Create Issue**: An issue is created in the "To Do" state with a detailed description, priority, and an optional schedule for execution.
2.  **AI Execution**: When triggered (manually or by schedule), the application invokes the Gemini CLI/Opencode CLI. The AI uses the issue details as a prompt to modify the files directly.
3.  **Testing & Review**: After the AI finishes, it generates a report detailing the changes. The issue is automatically moved to the "Testing" status, where the user can review the AI's work.
4.  **Approve or Reject**:
    - **Approve**: If the user is satisfied with the changes, they can approve them. The application will then commit the changes to the Git repository, and the issue is moved to "Done".
    - **Reject**: If the changes are not satisfactory, the user can reject them. The application uses Git to automatically revert all modifications, and the issue is moved back to "To Do" for re-evaluation.

## Features

- **Project Management**: Create projects linked to absolute paths of local Git repositories.
- **Issue Management**: Full CRUD functionality for issues with status (`To Do`, `Testing`, `Done`), priority (`Low`, `Medium`, `High`, `Critical`), and scheduling.
- **Automated AI Resolution**: Trigger Gemini CLI/Opencode CLI to read issue details and perform file modifications.
- **Interactive Approval**: A UI to review AI-generated reports and approve (commit) or reject (revert) changes.
- **History & Logging**: Keeps a log of all AI interactions and status changes for each issue.

## Technology Stack

- **Framework**: [Astro](https://astro.build/) (SSR with the Node.js adapter)
- **UI Interactivity**: [Alpine.js](https://alpinejs.dev/)
- **Database**: [Astro DB](https://docs.astro.build/en/guides/database/) (SQLite-based)
- **Git Integration**: [simple-git](https://github.com/steveukx/git-js)
- **AI Integration**: Google's [Gemini CLI](https://ai.google.dev/docs/gemini_cli) and [Opencode CLI](https://opencode.ai/docs/cli/) (via Node.js `child_process`)

## Requirements

Before running the application, ensure the following are installed on your system:

- **Node** (v18 or higher recommended)
- **Git**
- **Gemini CLI** - [Install guide](https://ai.google.dev/docs/gemini_cli)
- **Opencode CLI** (optional alternative to Gemini CLI) - [Install guide](https://opencode.ai)

## Prerequisites

The application uses **Gemini CLI** or **Opencode** to execute AI-powered issue resolution. Ensure that either `gemini` or `opencode` command is available in your system's PATH.

## Installation

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/lebohang0824/doppler.git
    cd doppler
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

## Running the Application

1.  **Start the development server:**

    ```sh
    npm run dev
    ```

2.  **Access the application:**
    Open your browser and navigate to `http://localhost:4321`.

## How to Use

1.  **Create a Project**: From the UI, create a new project by providing a name and the absolute file path to a local Git repository on your machine.
2.  **Create an Issue**: Select a project and create a new issue. Provide a clear and detailed description of the task you want the AI to perform.
3.  **Trigger AI Execution**: From the issue details page, trigger the AI execution.
4.  **Review the Report**: Once the issue status changes to "Testing," review the report and the file changes made by the AI.
5.  **Approve or Reject**: Based on your review, either approve the changes to commit them or reject them to revert.
