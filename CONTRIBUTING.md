# Contributing to MemeTray

> [!IMPORTANT]
> We ask that all contributors read our [legal disclaimer](./DISCLAIMER.md) before contributing to MemeTray.

MemeTray welcomes contributions and corrections. Before contributing, please make sure you have read the guidelines below. If you're new to _git_ and/or _GitHub_, we suggest you go through [the GitHub Guides](https://guides.github.com/introduction/flow/).

## Table of Contents

- [Contribution Workflow](#contribution-workflow)
- [Commit Message Guidelines](#commit-message-guidelines)
- [GIF Requirements](#gif-requirements)
  - [File Format](#file-format)
  - [Dimensions](#dimensions)
  - [Naming Convention](#naming-convention)
  - [Background Removal](#background-removal)
- [Updating `index.json`](#updating-indexjson)
- [Content We Do Not Accept](#content-we-do-not-accept)
- [Code of Conduct](#code-of-conduct)

## Contribution Workflow

1.  **Fork** this repository.
2.  (Optional) Clone the repository.

    -   Using SSH
        ```shell
        git clone git@github.com:MemeTray/MemeTray.git
        ```
    -   Using HTTPS
        ```shell
        git clone https://github.com/MemeTray/MemeTray.git
        ```
    -   Using GitHub CLI
        ```shell
        gh repo clone MemeTray/MemeTray
        ```

3.  Create a new branch from the latest `main`.
4.  Start hacking on the new branch.
5.  Commit and push to the new branch.
6.  Make a pull request.

## Commit Message Guidelines

To maintain a clear and readable project history, we recommend using the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format for your commit messages.

Each commit should include a type prefix, for example:
-   `feat:` for adding new GIFs or features.
    -   `feat: Add 10 new cat memes`
-   `fix:` for correcting issues or errors.
    -   `fix: Correct count for doro collection in index.json`
-   `docs:` for updating documentation, such as `README.md` or `CONTRIBUTING.md`.
    -   `docs: Update contribution guidelines`

Following this simple convention helps us better manage the project.

## GIF Requirements

### File Format

We only accept animations in **GIF** format.

**Reason**: This is to ensure compatibility with older operating systems like Windows 7, which do not have native support for the WebP format.

### Dimensions

All GIFs must be resized to **128px × 128px**.

To help you with this, we provide an online tool:
[**MemeTray Animation Compression Tool**](https://memetray.org/tools/animation-compression/)

### Naming Convention

GIF files must follow the format `XXXX_<folder_name>.gif`, where:
- `XXXX` is a four-digit sequential number, starting from `0001`.
- `<folder_name>` is the name of the category folder where the GIF is located.

**Examples**:
- The first GIF in the `catmeme` folder should be named `0001_catmeme.gif`.
- The 181st GIF in the `doro` folder should be named `0181_doro.gif`.

### Background Removal

Many GIFs come with a white or solid-colored background. We encourage contributors to help remove these backgrounds to make the GIFs more versatile.

- **Priority**: If two versions of the same GIF exist (one with a background and one without), we will prioritize the version without the background.
- You are welcome to submit versions with backgrounds removed to replace existing ones.

## Updating `index.json`

After adding or deleting GIFs, you **must** update the `gifs/index.json` file in the root directory.

**> Why is a manual update required?**
> We previously attempted to generate the index automatically by probing for files, but this approach led to significant initial loading times. To ensure a fast user experience, we have opted for a static index file, which requires manual updates from contributors.

1.  **Adding a New Folder/Category**:
    If you create a new GIF category folder, add a new object to the `sections` array.
    ```json
    { "dir": "your-new-folder", "count": 10 }
    ```

2.  **Updating GIF Count**:
    If you add or delete GIFs in an existing folder, make sure to update the `count` value for the corresponding category to match the actual number of GIFs in that folder.

## Content We Do Not Accept

To avoid copyright issues and legal risks, we **do not accept** the following types of GIFs:

1.  **Brand Logos**: Any content that includes clearly identifiable commercial brand logos.
2.  **Memes of Public Figures**: Memes featuring the likeness of public figures (e.g., actors, influencers, politicians).
3.  **Content from Film and Television**:
    - Direct clips from movies, TV shows, animations, etc.
    - Fan-made content based on copyrighted works.
4.  **Brands with Strict Copyright Policies**: Content from the following companies (and others) that are known for strictly protecting their brand identity:
    - Amazon / AWS
    - BP
    - Disney
    - International Olympic Committee
    - Mattel
    - Microchip Technology Inc.
    - Microsoft
    - Oracle
    - Yahoo!

## Code of Conduct

Please ensure your contributions adhere to our community's Code of Conduct. We are committed to fostering a friendly and respectful environment.

Thank you for your contribution! :)
