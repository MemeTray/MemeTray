# Contributing to MemeTray

> [!IMPORTANT]
> We ask that all contributors read our [legal disclaimer](./DISCLAIMER.md) before contributing to MemeTray.

MemeTray welcomes contributions! Contributing is easy - just process your GIFs with our all-in-one tool and submit them to the appropriate repository. If you're new to _git_ and/or _GitHub_, we suggest you go through [the GitHub Guides](https://guides.github.com/introduction/flow/).

## Table of Contents

- [Quick Start: Contributing GIFs](#quick-start-contributing-gifs)
- [Detailed Contribution Workflow](#detailed-contribution-workflow)
- [Using the All-in-One Processing Tool](#using-the-all-in-one-processing-tool)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Adding a New Category](#adding-a-new-category)
- [Content We Do Not Accept](#content-we-do-not-accept)
- [Code of Conduct](#code-of-conduct)

## Quick Start: Contributing GIFs

**The easiest way to contribute:**

1. **Process your GIFs**: Visit [**MemeTray All-in-One Tool**](https://memetray.org/tools/all-in-one/)
   - Upload your GIF files
   - The tool automatically handles resizing, compression, and renaming
   - Download the processed files

2. **Submit to the appropriate repository**:
   - Find the category repository (e.g., `gifs-doro`, `gifs-catmeme`, `gifs-maomaochong`)
   - Fork the repository and add your processed GIFs to the category folder
   - Create a pull request

3. **Don't see your category?** Contact the maintainers via [GitHub Issues](https://github.com/MemeTray/MemeTray/issues) to request a new category repository.

**That's it!** No manual configuration needed - our automated system will detect and index your GIFs automatically.

## Detailed Contribution Workflow

### For Existing Categories

**Recommended: Direct GitHub Upload (Best for GIFs)**

Since GIF files are large, we recommend using GitHub's web interface directly:

1. **Process your GIFs** using the [All-in-One Tool](https://memetray.org/tools/all-in-one/)
2. **Fork the repository** on GitHub (click the "Fork" button on the repository page)
3. **Upload via web interface**:
   - Go to your forked repository
   - Navigate to the category folder (e.g., `doro/`)
   - Click "Add file" → "Upload files"
   - Drag and drop your processed GIFs
   - Commit message: Use the last filename (e.g., `feat: 0019_maodie.gif`)
   - Click "Commit changes"
4. **Create a pull request** back to the original repository

**Alternative: Using Git Command Line**

If you prefer using Git locally:

1. **Fork** the target GIF repository (e.g., `MemeTray/gifs-doro`)
2. **Process your GIFs** using the [All-in-One Tool](https://memetray.org/tools/all-in-one/)
3. **Clone your fork**:
    ```shell
    git clone https://github.com/YourUsername/gifs-categoryname.git
    ```
4. **Add your GIFs** to the category folder (e.g., `doro/`)
5. **Commit and push**:
    ```shell
    git add .
    git commit -m "feat: 0125_doro.gif"
    git push
    ```
6. **Create a pull request** to the original repository

### For New Categories

If you want to contribute GIFs for a category that doesn't exist yet:

1. Open an issue at [MemeTray/MemeTray](https://github.com/MemeTray/MemeTray/issues)
2. Describe your proposed category and provide sample GIFs
3. Once approved, we'll create the repository for you
4. Follow the workflow above to add your GIFs

## Using the All-in-One Processing Tool

Our [**All-in-One Tool**](https://memetray.org/tools/all-in-one/) handles everything automatically:

### Features
- ✅ **Automatic Resizing**: Converts GIFs to 128px × 128px
- ✅ **Compression**: Optimizes file size while maintaining quality
- ✅ **Auto-Numbering**: Generates sequential filenames (0001_category.gif, 0002_category.gif, etc.)
- ✅ **Batch Processing**: Handle multiple GIFs at once
- ✅ **Preview**: See your processed GIFs before downloading

### How to Use
1. Visit https://memetray.org/tools/all-in-one/
2. Select or drag your GIF files
3. Choose your category name (the suffix for filenames)
4. Set the starting number (defaults to 0001)
5. Adjust compression settings if needed
6. Download the processed GIFs
7. Upload them to the appropriate repository folder

**No manual editing required!** The tool ensures all GIFs meet our requirements automatically.

## Commit Message Guidelines

To maintain a clear and readable project history, we use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format.

**For adding GIFs, use the filename of the last GIF in your contribution:**
-   `feat: 0019_maodie.gif` (if adding GIFs up to 0019)
-   `feat: 0125_doro.gif` (if adding GIFs up to 0125)

**For other changes:**
-   `fix: Replace corrupted 0024_doro.gif`
-   `docs: Update README with new examples`

Following this convention helps us better manage the project.

## Adding a New Category

Want to create a new GIF category?

1. **Check existing categories** at https://memetray.org/ to avoid duplicates
2. **Open an issue** at [MemeTray/MemeTray](https://github.com/MemeTray/MemeTray/issues)
3. **Include in your request**:
   - Proposed category name (lowercase, no spaces, use hyphens)
   - Description of what GIFs will be in this category
   - 3-5 sample GIFs to demonstrate the theme
4. **Wait for approval** - maintainers will create the `gifs-categoryname` repository
5. **Start contributing** using the workflow above

**Note:** Our automated system will automatically detect new repositories named `gifs-*` and add them to the main site. No manual configuration needed!

## Content We Do Not Accept

To avoid copyright issues and legal risks, we **do not accept** the following types of GIFs:

1.  **Pornographic or Sexually Explicit Content**: Any material that is pornographic, sexually explicit, or NSFW (Not Safe For Work).
2.  **Brand Logos**: Any content that includes clearly identifiable commercial brand logos.
3.  **Memes of Public Figures**: Memes featuring the likeness of public figures (e.g., actors, influencers, politicians).
4.  **Content from Film and Television**:
    - Direct clips from movies, TV shows, animations, etc.
    - Fan-made content based on copyrighted works.
5.  **Brands with Strict Copyright Policies**: Content from the following companies (and others) that are known for strictly protecting their brand identity:
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
