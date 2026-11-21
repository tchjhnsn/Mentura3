"use client";

// M6 My profile, after Contra's profile: your public founder profile, the shared profile as Mentura shows it.
import { ME } from "@/components/mentura/data";
import { ProfileView } from "@/components/mentura/profile-view";

export default function MyProfile() {
  return <ProfileView handle={ME} mine n="M6" />;
}
