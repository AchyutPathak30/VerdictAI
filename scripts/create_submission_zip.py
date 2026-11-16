import os
import zipfile

PROJECT_DIR = r"d:\WSSOA Project"
OUTPUT_ZIP = r"d:\WSSOA Project\VerdictAI_Source_Code.zip"

EXCLUDE_DIRS = {
    'node_modules',
    '.git',
    '.venv',
    'venv',
    'env',
    '__pycache__',
    '.pytest_cache',
    'dist',
    'build',
    '.idea',
    '.vscode'
}

EXCLUDE_FILES = {
    'VerdictAI_Source_Code.zip',
    '.DS_Store',
    'Thumbs.db'
}

def make_zip():
    print(f"Creating zip at: {OUTPUT_ZIP}")
    file_count = 0
    total_uncompressed_bytes = 0

    with zipfile.ZipFile(OUTPUT_ZIP, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for root, dirs, files in os.walk(PROJECT_DIR):
            # Filter directories in-place so os.walk does not descend into them
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.git')]

            for file in files:
                if file in EXCLUDE_FILES or file.endswith('.zip') or file.endswith('.pyc'):
                    continue

                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, PROJECT_DIR)

                # Avoid root-level giant binary reports if not necessary, but include all code/configs/docs
                zf.write(abs_path, arcname=os.path.join("VerdictAI", rel_path))
                file_count += 1
                total_uncompressed_bytes += os.path.getsize(abs_path)

    zip_size_mb = os.path.getsize(OUTPUT_ZIP) / (1024 * 1024)
    print(f"Successfully zipped {file_count} files.")
    print(f"Total uncompressed: {total_uncompressed_bytes / (1024*1024):.2f} MB")
    print(f"Zip file size: {zip_size_mb:.2f} MB")

if __name__ == '__main__':
    make_zip()
