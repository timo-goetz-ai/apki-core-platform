import { NextResponse } from 'next/server';
import { listDriveFiles, createDriveFolder, gdriveConfig } from '@/lib/gdrive';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId') ?? gdriveConfig.rootFolderId();
    if (!folderId) {
      return NextResponse.json({ error: 'GDRIVE_AIOS_ROOT_FOLDER_ID not configured' }, { status: 500 });
    }
    const files = await listDriveFiles(folderId, 50);
    return NextResponse.json({ files, folderId });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Drive error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, parentFolderId } = body as { name?: string; parentFolderId?: string };
    if (!name) {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }
    const parent = parentFolderId ?? gdriveConfig.rootFolderId();
    if (!parent) {
      return NextResponse.json({ error: 'GDRIVE_AIOS_ROOT_FOLDER_ID not configured' }, { status: 500 });
    }
    const folderId = await createDriveFolder(name, parent);
    return NextResponse.json({ folderId, name });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Drive error' }, { status: 500 });
  }
}
