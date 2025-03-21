import { handleAudioUpload } from "@docmost/editor-ext";
import { uploadFile } from "@/features/page/services/page-service.ts";
import { notifications } from "@mantine/notifications";
import { getFileUploadSizeLimit } from "@/lib/config.ts";
import { formatBytes } from "@/lib";
import i18n from "@/i18n.ts";

export const uploadAudioAction = handleAudioUpload({
  onUpload: async (file: File, pageId: string): Promise<any> => {
    try {
      const uploadId = notifications.show({
        id: `audio-upload-${Date.now()}`,
        loading: true,
        title: i18n.t("Uploading audio"),
        message: file.name,
        autoClose: false,
        withCloseButton: false,
      });
      
      const result = await uploadFile(file, pageId);
      
      // Update notification on success
      notifications.update({
        id: uploadId,
        color: "green",
        title: i18n.t("Audio uploaded"),
        message: file.name,
        loading: false,
        autoClose: 3000,
      });
      
      return result;
    } catch (err) {
      notifications.show({
        color: "red",
        message: err?.response?.data?.message || i18n.t("Failed to upload audio"),
      });
      throw err;
    }
  },
  validateFn: (file) => {
    const validTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/aac", "audio/webm"];
    if (!validTypes.includes(file.type)) {
      notifications.show({
        color: "red",
        message: i18n.t("Supported audio formats: MP3, WAV, OGG, AAC"),
      });
      return false;
    }
    
    if (file.size > getFileUploadSizeLimit()) {
      notifications.show({
        color: "red",
        message: i18n.t("File exceeds the {{limit}} attachment limit", {
          limit: formatBytes(getFileUploadSizeLimit()),
        }),
      });
      return false;
    }
    return true;
  },
});
