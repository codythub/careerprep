import { afterAll, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { resetDatabase } from "./helpers";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await db.$disconnect();
});
