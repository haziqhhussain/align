import os
import uuid
import re
from fastapi import HTTPException, status, UploadFile
from app.config import settings

def sanitize_filename(filename: str) -> str:
    """
    Sanitizes user-provided original filenames to prevent path traversal and shell injection.
    Ex: "../../../etc/passwd" -> "passwd"
    """
    if not filename:
        return "unnamed_file"
    # Take only the basename
    cleaned = os.path.basename(filename)
    # Remove null bytes or backslashes
    cleaned = cleaned.replace("\0", "").replace("\\", "_")
    # Remove any leading path traversal patterns
    cleaned = re.sub(r'^\.+[\/\\]', '', cleaned)
    return cleaned if cleaned else "unnamed_file"

def get_extension(filename: str) -> str:
    if "." in filename:
        return filename.rsplit(".", 1)[-1].lower()
    return ""

def validate_file(filename: str, file_size: int, mime_type: str = ""):
    """
    Validates file size and extension security rules.
    """
    if file_size <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    if file_size > settings.MAX_UPLOAD_SIZE:
        max_mb = settings.MAX_UPLOAD_SIZE // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File must be smaller than {max_mb} MB."
        )

    ext = get_extension(filename)

    if ext in settings.FORBIDDEN_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Executable file type '.{ext}' is strictly forbidden."
        )

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '.{ext}' is not supported. Allowed formats: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}."
        )

def get_safe_file_path(relative_path: str) -> str:
    """
    Resolves the absolute path for a stored relative file path, ensuring it stays strictly
    within the configured UPLOAD_DIR.
    """
    base_dir = os.path.abspath(settings.UPLOAD_DIR)
    target_path = os.path.abspath(os.path.join(base_dir, relative_path))

    if not target_path.startswith(base_dir):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: path traversal attempt detected."
        )
    return target_path

def save_uploaded_file(file: UploadFile, subfolder: str) -> tuple[str, str, str, int, str]:
    """
    Saves an uploaded file to disk inside settings.UPLOAD_DIR / subfolder.
    Returns (clean_original_filename, stored_file_name, relative_path, file_size, mime_type)
    """
    original_name = sanitize_filename(file.filename or "unnamed_file")
    ext = get_extension(original_name)
    ext_suffix = f".{ext}" if ext else ""

    # Generate UUID stored name
    stored_file_name = f"{uuid.uuid4()}{ext_suffix}"
    relative_path = os.path.join(subfolder, stored_file_name).replace("\\", "/")

    # Ensure target directory exists
    target_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(target_dir, exist_ok=True)

    abs_target_path = get_safe_file_path(relative_path)

    # Read and save bytes cleanly
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)

    # Validate size & extension before writing to disk
    mime_type = file.content_type or "application/octet-stream"
    validate_file(original_name, file_size, mime_type)

    with open(abs_target_path, "wb") as buffer:
        while chunk := file.file.read(1024 * 1024): # 1MB chunks
            buffer.write(chunk)

    return original_name, stored_file_name, relative_path, file_size, mime_type

def delete_stored_file(relative_path: str) -> bool:
    """
    Safely deletes physical file from disk. Returns True if deleted, False if missing.
    Does not raise error if file was manually deleted from filesystem.
    """
    try:
        abs_path = get_safe_file_path(relative_path)
        if os.path.exists(abs_path) and os.path.isfile(abs_path):
            os.remove(abs_path)
            return True
    except Exception as e:
        print(f"[StorageService] Warning during physical file deletion: {e}")
    return False
