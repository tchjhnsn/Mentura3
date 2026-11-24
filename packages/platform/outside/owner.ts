import { closeSync, constants, lstatSync, openSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The account stamped on a venture, if any. Same file as `OWNER_FILE` in `console/lib/claims.ts`:
 * `<venture>/.naive/owner-account`. Missing or empty means no stamp. A symlink is refused before
 * the file is read, so the stamp cannot be the signing key. This is not a second store.
 */
export function stampedAccountOwner(dir: string): string | null {
  const folder = join(dir, ".naive");
  const file = join(folder, "owner-account");
  let folderStat;
  try {
    folderStat = lstatSync(folder);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error("outside: owner file must not be a symlink");
  }
  if (folderStat.isSymbolicLink() || !folderStat.isDirectory()) throw new Error("outside: owner file must not be a symlink");
  let st;
  try {
    st = lstatSync(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error("outside: owner file must not be a symlink");
  }
  if (st.isSymbolicLink() || !st.isFile() || st.nlink !== 1) throw new Error("outside: owner file must not be a symlink");
  const fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const text = readFileSync(fd, "utf8").trim();
    if (text.length === 0) return null;
    if (text.length > 80 || /[\r\n]/.test(text) || !/^[A-Za-z0-9_-]+$/.test(text)) {
      throw new Error("outside: owner file must not be a symlink");
    }
    return text;
  } finally {
    closeSync(fd);
  }
}
