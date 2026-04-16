import { z } from "zod";
import { ALLOWED_DOMAINS } from "@/lib/utils/constants";

export const emailDomainSchema = z.string().email().refine(
  (email) => {
    const domain = email.split("@")[1]?.toLowerCase();
    return ALLOWED_DOMAINS.some((allowed) => domain === allowed);
  },
  { message: "Only Sun* accounts are authorized" }
);
