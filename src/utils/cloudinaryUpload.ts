// utils/cloudinaryUpload.ts
const UPLOAD_PRESET = "framez"; // unsigned preset
const CLOUD_NAME = "dhkjho8pc";

export const uploadToCloudinary = async (uri: string) => {
  try {
    const formData = new FormData();

    // Convert local file URI to a blob
    const fileParts = uri.split("/");
    const fileName = fileParts[fileParts.length - 1];

    formData.append("file", {
      uri,
      type: "image/jpeg",
      name: fileName,
    } as any);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.log("Cloudinary error:", data);
      throw new Error(data.error?.message || "Cloudinary upload failed");
    }

    return data.secure_url;
  } catch (err: any) {
    console.error("Upload error:", err);
    throw err;
  }
};
