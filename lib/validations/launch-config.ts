import { z } from "zod";

const launchConfigSchema = z.object({
  launchDate: z.string().datetime({ offset: true }),
});

export type LaunchConfig = {
  launchDate: Date;
};

export function getLaunchConfig(): LaunchConfig | null {
  const raw = process.env.NEXT_PUBLIC_LAUNCH_DATE;
  const result = launchConfigSchema.safeParse({ launchDate: raw });

  if (!result.success) {
    console.warn(
      "[prelaunch] Invalid NEXT_PUBLIC_LAUNCH_DATE; gate is inactive (fail-open).",
      result.error.issues.map((i) => i.message).join("; ")
    );
    return null;
  }

  return { launchDate: new Date(result.data.launchDate) };
}
