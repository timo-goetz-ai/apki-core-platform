import { getSlides, getDrive } from "../google-auth.js";

const slides = () => getSlides();
const drive = () => getDrive();

export interface PresentationInfo {
  id: string;
  title: string;
  url: string;
  slideCount: number;
  slideIds: string[];
}

export async function createPresentation(
  title: string,
  parentFolderId?: string
): Promise<PresentationInfo> {
  const res = await slides().presentations.create({
    requestBody: { title },
  });

  const presentationId = res.data.presentationId!;

  if (parentFolderId) {
    const file = await drive().files.get({ fileId: presentationId, fields: "parents" });
    await drive().files.update({
      fileId: presentationId,
      addParents: parentFolderId,
      removeParents: (file.data.parents || []).join(","),
    });
  }

  const slidesList = res.data.slides || [];
  return {
    id: presentationId,
    title: res.data.title || title,
    url: `https://docs.google.com/presentation/d/${presentationId}`,
    slideCount: slidesList.length,
    slideIds: slidesList.map((s) => s.objectId || ""),
  };
}

export async function getPresentation(
  presentationId: string
): Promise<PresentationInfo> {
  const res = await slides().presentations.get({ presentationId });
  const slidesList = res.data.slides || [];
  return {
    id: res.data.presentationId!,
    title: res.data.title || "",
    url: `https://docs.google.com/presentation/d/${res.data.presentationId}`,
    slideCount: slidesList.length,
    slideIds: slidesList.map((s) => s.objectId || ""),
  };
}

export async function addSlide(
  presentationId: string,
  layout:
    | "BLANK"
    | "TITLE"
    | "TITLE_AND_BODY"
    | "SECTION_HEADER"
    | "BIG_NUMBER" = "BLANK"
): Promise<string> {
  const objectId = `slide_${Date.now()}`;

  // Map simple names to layout IDs
  const layoutMap: Record<string, string> = {
    BLANK: "BLANK",
    TITLE: "TITLE",
    TITLE_AND_BODY: "TITLE_AND_BODY",
    SECTION_HEADER: "SECTION_HEADER",
    BIG_NUMBER: "BIG_NUMBER",
  };

  await slides().presentations.batchUpdate({
    presentationId,
    requestBody: {
      requests: [
        {
          createSlide: {
            objectId,
            slideLayoutReference: {
              predefinedLayout: layoutMap[layout] || "BLANK",
            },
          },
        },
      ],
    },
  });

  return objectId;
}

export async function addTextToSlide(
  presentationId: string,
  slideId: string,
  text: string,
  options: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fontSize?: number;
  } = {}
): Promise<string> {
  const boxId = `textbox_${Date.now()}`;
  const emu = 914400; // EMU per inch

  await slides().presentations.batchUpdate({
    presentationId,
    requestBody: {
      requests: [
        {
          createShape: {
            objectId: boxId,
            shapeType: "TEXT_BOX",
            elementProperties: {
              pageObjectId: slideId,
              size: {
                width: { magnitude: (options.width || 6) * emu, unit: "EMU" },
                height: { magnitude: (options.height || 2) * emu, unit: "EMU" },
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: (options.x || 1) * emu,
                translateY: (options.y || 1) * emu,
                unit: "EMU",
              },
            },
          },
        },
        {
          insertText: {
            objectId: boxId,
            text,
          },
        },
      ],
    },
  });

  return boxId;
}

export async function exportPresentation(
  presentationId: string,
  format: "pptx" | "pdf" = "pptx"
): Promise<string> {
  const mimeMap = {
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    pdf: "application/pdf",
  };

  const res = await drive().files.export(
    { fileId: presentationId, mimeType: mimeMap[format] },
    { responseType: "arraybuffer" }
  );

  return Buffer.from(res.data as ArrayBuffer).toString("base64");
}
