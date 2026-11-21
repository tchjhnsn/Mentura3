"use client";

// M7 Someone's profile, after Contra's Profile seen by others (data.ts REFS.profile): what a person makes and does; follow or message them.
import { use } from "react";
import { ME } from "@/components/mentura/data";
import { ProfileView } from "@/components/mentura/profile-view";

export default function SomeonesProfile({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);
  return <ProfileView handle={handle} mine={handle === ME} n="M7" />;
}
