import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(url, key);

// Pull test response rows
const { data, error } = await supabase
  .from("student_responses")
  .select("*");

if (error) {
  throw new Error(`Database query failed: ${error.message}`);
}

console.log(data);

// Download the test recording
const { data: recording, error: downloadError } = await supabase
  .storage
  .from("interview-recordings")
  .download("00000000-0000-0000-0000-000000000001/1.webm");

if (downloadError) {
  throw new Error(`Download failed: ${downloadError.message}`);
}

await writeFile("test.webm", Buffer.from(await recording.arrayBuffer()));

console.log("Recording downloaded successfully.");