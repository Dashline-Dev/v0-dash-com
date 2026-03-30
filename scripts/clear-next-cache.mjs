import { rmSync, existsSync } from "fs"
import { join } from "path"

const nextDir = join(process.cwd(), ".next")

if (existsSync(nextDir)) {
  console.log("[v0] Clearing .next cache directory...")
  rmSync(nextDir, { recursive: true, force: true })
  console.log("[v0] .next cache cleared successfully.")
} else {
  console.log("[v0] No .next directory found — nothing to clear.")
}
