# GIF Renamer Tool

A web-based tool for batch renaming GIF files to MemeTray's standard naming format.

## Features

- **Batch Renaming**: Rename multiple GIF files at once
- **Standard Format**: Converts to MemeTray format (e.g., `0001_doro.gif`, `0002_doro.gif`)
- **Drag & Drop**: Support for dragging files and folders
- **Configurable**: Set custom start number and suffix
- **Preview**: Real-time preview of naming format
- **Download**: Get all renamed files as a ZIP archive

## Usage

1. **Configure Naming**:
   - Set the starting number (default: 1)
   - Set the suffix (e.g., "doro", "cat", "meme")
   - Preview shows the format: `0001_doro.gif`

2. **Add Files**:
   - Drag & drop GIF files or folders
   - Or click to select files manually
   - Only GIF files will be processed

3. **Review Changes**:
   - See original filename → new filename mapping
   - Remove individual files if needed
   - File count and sizes are displayed

4. **Download**:
   - Click "Download Renamed Files"
   - Get a ZIP file with all renamed GIFs
   - ZIP filename includes suffix and date

## Naming Format

The tool follows MemeTray's standard naming convention:
- **Pattern**: `XXXX_suffix.gif`
- **Number**: 4-digit zero-padded (0001, 0002, etc.)
- **Suffix**: Custom category name
- **Extension**: Always `.gif`

## Examples

- Input: `funny-cat.gif`, `another-cat.gif`
- Config: Start=1, Suffix="cat"
- Output: `0001_cat.gif`, `0002_cat.gif`

## Technical Details

- **File Processing**: Client-side only, no server upload
- **ZIP Creation**: Uses JSZip library for packaging
- **File Support**: GIF images only
- **Browser Compatibility**: Modern browsers with File API support

## Integration

This tool is part of the MemeTray toolkit and can be accessed from the main MemeTray interface via the Tools dropdown menu.
