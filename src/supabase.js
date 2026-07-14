import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://jyxlczrbcgbpnqpldgmb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5eGxjenJiY2dicG5xcGxkZ21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTU3NDQsImV4cCI6MjA5OTUzMTc0NH0.lENWVSFlp-EzSDzEd6dI2xFrGVw7Ua7rjv1qLbjdOFE"
);
