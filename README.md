<!-- Project Title + Logo -->
<div align="center">
  <a href="https://memetray.org/" target="_blank">
    <img src="Images/MemeTray.png" alt="MemeTray" width="240">
  </a>
  <h1>MemeTray</h1>
</div>

<p align="center">
See them all on one page at <a href="https://memetray.org/">MemeTray.org</a>. Contributions, corrections & requests can be made on GitHub.</p>
</p>


<img width="1920" height="869" alt="image" src="https://github.com/user-attachments/assets/96741450-343b-460c-acde-cf798a951b07" />


## Usage

> [!IMPORTANT]\
> Before using any GIFs from this project, please read our [legal disclaimer](./DISCLAIMER.md).

## Architecture

MemeTray uses a **centralized configuration architecture**:

- All GIF collections are stored in separate repositories (`gifs-*`)
- Configuration is centralized in `sections.json`
- GitHub Actions automatically updates GIF counts daily
- Fast loading: 1 network request instead of 6

**Adding new collections:**
1. Create a new repository named `gifs-xxx`
2. Upload GIF files
3. Wait for automatic update (or manually trigger the workflow)

No manual configuration needed!

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=MemeTray/MemeTray&type=date&legend=top-left)](https://www.star-history.com/#MemeTray/MemeTray&type=date&legend=top-left)

## Acknowledgments

This project uses the following services:

- **[Alcy.cc Random Wallpaper API](https://t.alcy.cc/)** - Free random wallpaper service used for desktop backgrounds.

## Contributors

<a href="https://github.com/MemeTray/MemeTray/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=MemeTray/MemeTray" />
</a>


