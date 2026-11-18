import { mark } from "@/lib/icon-mark";

// The icon iOS shows when someone adds Reflect to their home screen.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return mark(180);
}
