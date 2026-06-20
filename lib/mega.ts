import { File, Storage } from "megajs";

type MegaProgress = {
  bytesLoaded: number;
  bytesTotal: number;
  percentage: number;
};

type UploadOptions = {
  replaceExisting?: boolean;
  onProgress?: (progress: MegaProgress) => void;
};

type MegaFileResult = {
  name: string;
  nodeId: string;
  size: number;
  url: string;
};

let storagePromise: Promise<Storage> | null = null;

function requireMegaCredentials() {
  const email = String(process.env.MEGA_EMAIL || "").trim();
  const password = String(process.env.MEGA_PASSWORD || "").trim();

  if (!email || !password) {
    throw new Error("MEGA_EMAIL and MEGA_PASSWORD must be set.");
  }

  return { email, password };
}

function normalizeMegaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (/ENOENT/i.test(message) || /Wrong password/i.test(message) || /object .* not found/i.test(message)) {
    return new Error(
      "Unable to sign in to Mega. Check MEGA_EMAIL and MEGA_PASSWORD in .env.local, then restart the app.",
    );
  }

  return error instanceof Error ? error : new Error(message);
}

export async function getMegaStorage(): Promise<Storage> {
  if (!storagePromise) {
    storagePromise = (async () => {
      const { email, password } = requireMegaCredentials();

      try {
        const storage = new Storage({
          email,
          password,
          userAgent: "SmartTutors/1.0",
        });

        return await storage.ready;
      } catch (error) {
        storagePromise = null;
        throw normalizeMegaError(error);
      }
    })();
  }

  try {
    return await storagePromise;
  } catch (error) {
    storagePromise = null;
    throw normalizeMegaError(error);
  }
}

function getProgressInfo(bytesLoaded: number, bytesTotal: number): MegaProgress {
  const percentage =
    bytesTotal > 0 ? Math.min(100, Math.round((bytesLoaded / bytesTotal) * 100)) : 0;

  return {
    bytesLoaded,
    bytesTotal,
    percentage,
  };
}

export async function uploadBufferToMega(
  fileName: string,
  buffer: Buffer,
  options: UploadOptions = {},
): Promise<MegaFileResult> {
  const storage = await getMegaStorage();

  if (options.replaceExisting) {
    const existing = storage.root.children?.find(
      (file: any) => file.name === fileName,
    );

    if (existing) {
      await existing.delete(true);
    }
  }

  const uploadStream = storage.upload(
    {
      name: fileName,
      size: buffer.byteLength,
      allowUploadBuffering: false,
    },
    buffer,
  );

  if (options.onProgress) {
    uploadStream.on("progress", ({ bytesUploaded, bytesTotal }: any) => {
      options.onProgress?.(getProgressInfo(bytesUploaded, bytesTotal));
    });
  }

  try {
    const file = await uploadStream.complete;
    const url = await file.link();

    return {
      name: file.name || fileName,
      nodeId: String(file.nodeId || ""),
      size: Number(file.size || buffer.byteLength),
      url,
    };
  } catch (error) {
    console.error(`Upload failed for: ${fileName}`, error);
    throw error;
  }
}

export async function downloadMegaFileBuffer(
  downloadUrl: string,
  onProgress?: (progress: MegaProgress) => void,
): Promise<Buffer> {
  const storage = await getMegaStorage();
  const file = File.fromURL(downloadUrl, { api: storage.api });

  if (onProgress) {
    file.on("progress", ({ bytesLoaded, bytesTotal }: any) => {
      onProgress(getProgressInfo(bytesLoaded, bytesTotal));
    });
  }

  return await file.downloadBuffer();
}

export async function deleteMegaFileByNodeId(nodeId: string) {
  if (!nodeId) {
    return;
  }

  const storage = await getMegaStorage();
  const file =
    storage.files?.[nodeId] ||
    storage.root.children?.find((candidate: any) => candidate.nodeId === nodeId);

  if (file) {
    await file.delete(true);
  }
}

export async function getMegaPublicLinkForNodeId(nodeId: string) {
  if (!nodeId) {
    return "";
  }

  const storage = await getMegaStorage();
  const file =
    storage.files?.[nodeId] ||
    storage.root.children?.find((candidate: any) => candidate.nodeId === nodeId);

  if (!file) {
    return "";
  }

  return await file.link();
}
