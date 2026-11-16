import { permanentRedirect } from "next/navigation";

/** The philosophers list became People in history. */
export default function OldPhilosophers() {
  permanentRedirect("/schole/people/history");
}
