import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PublicKudo } from "@/types/kudos";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      copyLink: "Copy Link",
      viewDetail: "Xem chi tiết",
      disabledTitle: "Sắp ra mắt",
    };
    return t[key] ?? key;
  },
}));

const { HighlightCard } = await import(
  "@/components/kudos/LiveBoard/HighlightCarousel/HighlightCard"
);

const baseKudo: PublicKudo = {
  id: 202,
  senderName: "Alice Chen",
  senderDepartment: "CEVC1",
  senderAvatarUrl: "https://example.com/alice.jpg",
  recipientId: 42,
  recipientName: "Bảo Nguyễn",
  recipientDepartment: "CEVC10",
  recipientAvatarUrl: "https://example.com/bao.jpg",
  title: {
    id: 1,
    name: "Idol giới trẻ",
    slug: "idol-gioi-tre",
    description: null,
    icon: null,
    sortOrder: 10,
  },
  body: { type: "doc", content: [] },
  bodyPlain:
    "Một lời cảm ơn chân thành và thật sâu sắc dành cho những việc rất nhỏ mà bạn đã làm cho đội trong suốt mấy tháng qua, cảm ơn bạn rất nhiều và luôn nhớ công lao của bạn.",
  hashtags: [
    { id: 10, label: "Dedicated", slug: "dedicated", usageCount: 10 },
    { id: 11, label: "Teamwork", slug: "teamwork", usageCount: 5 },
  ],
  images: [],
  mentions: [],
  isAnonymous: false,
  status: "published",
  createdAt: "2026-04-21T09:34:00.000Z",
  heartCount: 9,
  heartedByMe: false,
  canHeart: true,
};

describe("HighlightCard", () => {
  it("renders sender, recipient, title, time, content, chips, heart count", () => {
    render(<HighlightCard kudo={baseKudo} />);
    expect(screen.getByText("Alice Chen")).toBeInTheDocument();
    expect(screen.getByText("Bảo Nguyễn")).toBeInTheDocument();
    expect(screen.getByRole("time")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Idol giới trẻ/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Một lời cảm ơn chân thành/)).toBeInTheDocument();
    expect(screen.getByText("#Dedicated")).toBeInTheDocument();
    expect(screen.getByText("#Teamwork")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("applies 4-line clamp to the body", () => {
    const { container } = render(<HighlightCard kudo={baseKudo} />);
    const p = container.querySelector("p.line-clamp-4");
    expect(p).not.toBeNull();
  });

  it("renders Copy Link + Xem chi tiết as disabled this release", () => {
    render(<HighlightCard kudo={baseKudo} />);
    expect(screen.getByRole("button", { name: "Copy Link" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Xem chi tiết" }),
    ).toBeDisabled();
  });

  it("masks sender when isAnonymous=true", () => {
    const anon: PublicKudo = {
      ...baseKudo,
      senderName: "Thỏ bảy màu",
      senderAvatarUrl: null,
      isAnonymous: true,
    };
    render(<HighlightCard kudo={anon} />);
    expect(screen.getByText("Thỏ bảy màu")).toBeInTheDocument();
  });

  it("disables heart button when canHeart=false", () => {
    render(<HighlightCard kudo={{ ...baseKudo, canHeart: false }} />);
    const heart = screen.getByRole("button", { name: /Thả tim/ });
    expect(heart).toBeDisabled();
  });

  it("dims neighbour cards when focused=false", () => {
    const { container } = render(
      <HighlightCard kudo={baseKudo} focused={false} />,
    );
    const article = container.querySelector("article");
    expect(article?.className).toContain("opacity-50");
    expect(article?.className).toContain("scale-[0.92]");
    expect(article?.className).toContain("pointer-events-none");
  });
});
