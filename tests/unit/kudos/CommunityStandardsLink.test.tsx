import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      "actions.communityStandards": "Tiêu chuẩn cộng đồng",
      "actions.communityStandardsAria":
        "Mở tiêu chuẩn cộng đồng trong tab mới",
    };
    return t[key] ?? key;
  },
}));

const { CommunityStandardsLink } = await import(
  "@/components/kudos/WriteKudoModal/CommunityStandardsLink"
);

describe("CommunityStandardsLink", () => {
  it("renders as a new-tab link with safe rel + accessible name", () => {
    render(<CommunityStandardsLink />);
    const link = screen.getByRole("link", {
      name: "Mở tiêu chuẩn cộng đồng trong tab mới",
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("defaults href to /community-standards but accepts override", () => {
    const { rerender } = render(<CommunityStandardsLink />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/community-standards",
    );
    rerender(<CommunityStandardsLink href="/rules" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/rules");
  });
});
