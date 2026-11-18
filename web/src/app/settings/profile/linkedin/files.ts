// Which files of an upload are LinkedIn's export files Reflect reads (LINKEDIN_FILES), for the browser: a zip is
// unzipped here with fflate and only those files are kept, matched by base name in any folder, in any case.
import { strFromU8, unzipSync } from "fflate";
import { LINKEDIN_FILES, type LinkedinFiles } from "@reflect/core/profile";

/** The export file a path names (its base name, any case), or null when Reflect does not read it. */
export function linkedinFileName(path: string): (typeof LINKEDIN_FILES)[number] | null {
  const base = path.split(/[\\/]/).pop()?.trim().toLowerCase() ?? "";
  return LINKEDIN_FILES.find((f) => f.toLowerCase() === base) ?? null;
}

/** The export files inside a zip, as text. Nothing else in the zip is decompressed. */
export function unzipLinkedin(zip: Uint8Array): LinkedinFiles {
  const out: LinkedinFiles = {};
  const entries = unzipSync(zip, { filter: (f) => linkedinFileName(f.name) !== null });
  for (const [name, bytes] of Object.entries(entries)) {
    const f = linkedinFileName(name);
    if (f && !out[f]) out[f] = strFromU8(bytes);
  }
  return out;
}

/** The export files among files a person chose or dropped: zips unzipped, CSVs read by name; the rest ignored. */
export async function readUpload(files: readonly File[]): Promise<LinkedinFiles> {
  const out: LinkedinFiles = {};
  for (const file of files) {
    if (/\.zip$/i.test(file.name)) Object.assign(out, unzipLinkedin(new Uint8Array(await file.arrayBuffer())));
    else {
      const f = linkedinFileName(file.name);
      if (f) out[f] = await file.text();
    }
  }
  return out;
}
