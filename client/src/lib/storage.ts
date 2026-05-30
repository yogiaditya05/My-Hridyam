/**
 * Client-side storage helper for uploading files to S3 via the backend.
 * This is a wrapper that calls the backend storage API.
 */

export async function storagePut(
  key: string,
  data: Blob | Uint8Array | string | any,
  contentType?: string
): Promise<{ key: string; url: string }> {
  try {
    // Convert data to FormData for multipart upload
    const formData = new FormData();
    formData.append("key", key);
    let fileData: Blob;
    if (data instanceof Blob) {
      fileData = data;
    } else if (data instanceof Uint8Array) {
      fileData = new Blob([data as any], { type: contentType });
    } else if (typeof data === "string") {
      fileData = new Blob([data], { type: contentType });
    } else {
      fileData = new Blob([new Uint8Array(data)], { type: contentType });
    }
    formData.append("file", fileData);

    // Call backend storage endpoint
    const response = await fetch("/api/storage/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Storage] Upload failed:", error);
    throw error;
  }
}

export async function storageGet(
  key: string,
  expiresIn?: number
): Promise<{ key: string; url: string }> {
  try {
    const params = new URLSearchParams({ key });
    if (expiresIn) {
      params.append("expiresIn", expiresIn.toString());
    }

    const response = await fetch(`/api/storage/get?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Get failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("[Storage] Get failed:", error);
    throw error;
  }
}
