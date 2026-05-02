"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

/**
 * Convex client + provider for the app.
 *
 * `NEXT_PUBLIC_CONVEX_URL` is populated by the owner after running
 * `bunx convex dev` against the existing "backpacker" cloud project.
 * For M0 we tolerate the URL being absent at build time (the splash
 * does not call Convex), but the value is required at runtime once
 * any feature actually queries Convex.
 */
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

const convex = new ConvexReactClient(CONVEX_URL || "https://placeholder.convex.cloud");

export function BackpackerConvexProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
