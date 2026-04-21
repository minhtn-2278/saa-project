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

const { KudoPost } = await import(
  "@/components/kudos/LiveBoard/KudoFeed/KudoPost"
);

const baseKudo: PublicKudo = {
  id: 101,
  senderName: "Alice Chen",
  senderAvatarUrl: "https://example.com/alice.jpg",
  recipientId: 42,
  recipientName: "Bảo Nguyễn",
  recipientAvatarUrl: "https://example.com/bao.jpg",
  title: {
    id: 1,
    name: "Người truyền động lực cho tôi",
    slug: "nguoi-truyen-dong-luc",
    description: null,
    icon: null,
    sortOrder: 10,
  },
  body: { type: "doc", content: [] },
  bodyPlain: "Cảm ơn bạn rất nhiều!",
  hashtags: [
    { id: 10, label: "Dedicated", slug: "dedicated", usageCount: 10 },
    { id: 11, label: "Teamwork", slug: "teamwork", usageCount: 5 },
  ],
  images: [],
  mentions: [],
  isAnonymous: false,
  status: "published",
  createdAt: "2026-04-21T09:34:00.000Z",
  heartCount: 7,
  heartedByMe: false,
  canHeart: true,
};

describe("KudoPost", () => {
  it("renders sender name, recipient name, body, and time", () => {
    render(<KudoPost kudo={baseKudo} />);
    expect(screen.getByText("Alice Chen")).toBeInTheDocument();
    expect(screen.getByText("Bảo Nguyễn")).toBeInTheDocument();
    expect(screen.getByText(/Cảm ơn bạn rất nhiều/)).toBeInTheDocument();
    // Time format HH:mm - MM/DD/YYYY
    expect(screen.getByRole("time")).toBeInTheDocument();
  });

  it("renders hashtag chips (up to 5)", () => {
    render(<KudoPost kudo={baseKudo} />);
    expect(screen.getByText("#Dedicated")).toBeInTheDocument();
    expect(screen.getByText("#Teamwork")).toBeInTheDocument();
  });

  it("masks sender as anonymous when isAnonymous", () => {
    const anon: PublicKudo = {
      ...baseKudo,
      senderName: "Thỏ bảy màu",
      senderAvatarUrl: null,
      isAnonymous: true,
    };
    render(<KudoPost kudo={anon} />);
    expect(screen.getByText("Thỏ bảy màu")).toBeInTheDocument();
  });

  it("disables heart button when canHeart=false (author self-like rule)", () => {
    const own: PublicKudo = { ...baseKudo, canHeart: false };
    render(<KudoPost kudo={own} />);
    const heart = screen.getByRole("button", { name: /Thả tim/ });
    expect(heart).toBeDisabled();
  });

  it("shows heart count from the server", () => {
    render(<KudoPost kudo={{ ...baseKudo, heartCount: 42 }} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders Copy Link + Xem chi tiết as disabled this release", () => {
    render(<KudoPost kudo={baseKudo} />);
    const copy = screen.getByRole("button", { name: "Copy Link" });
    const detail = screen.getByRole("button", { name: "Xem chi tiết" });
    expect(copy).toBeDisabled();
    expect(detail).toBeDisabled();
  });
});
