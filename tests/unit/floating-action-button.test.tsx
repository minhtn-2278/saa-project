import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      "fab.writeKudo": "Viết Kudo",
      "fab.rules": "Thể lệ",
    };
    return t[key] ?? key;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const { FloatingActionButton } = await import(
  "@/components/shared/FloatingActionButton"
);

describe("FloatingActionButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders pill-shaped button", () => {
    render(<FloatingActionButton />);

    const button = screen.getByLabelText("Quick actions");
    expect(button).toBeInTheDocument();
  });

  it("has aria-expanded=false initially", () => {
    render(<FloatingActionButton />);

    const button = screen.getByLabelText("Quick actions");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("opens menu on click with 2 options", () => {
    render(<FloatingActionButton />);

    fireEvent.click(screen.getByLabelText("Quick actions"));

    expect(
      screen.getByLabelText("Quick actions")
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Viết Kudo")).toBeInTheDocument();
    expect(screen.getByText("Thể lệ")).toBeInTheDocument();
  });

  it("'Viết Kudo' dispatches kudo:open event (no URL change)", () => {
    render(<FloatingActionButton />);
    fireEvent.click(screen.getByLabelText("Quick actions"));

    const events: string[] = [];
    const listener = (e: Event) => events.push(e.type);
    window.addEventListener("kudo:open", listener);

    fireEvent.click(screen.getByText("Viết Kudo"));
    expect(events).toEqual(["kudo:open"]);

    window.removeEventListener("kudo:open", listener);
  });

  it("'Thể lệ' links to /rules", () => {
    render(<FloatingActionButton />);
    fireEvent.click(screen.getByLabelText("Quick actions"));

    const rulesLink = screen.getByText("Thể lệ");
    expect(rulesLink.closest("a")).toHaveAttribute("href", "/rules");
  });

  it("closes menu on Escape key", () => {
    render(<FloatingActionButton />);
    fireEvent.click(screen.getByLabelText("Quick actions"));

    expect(screen.getByText("Viết Kudo")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByText("Viết Kudo")).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("Quick actions")
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("closes menu on click-outside", () => {
    render(<FloatingActionButton />);
    fireEvent.click(screen.getByLabelText("Quick actions"));

    expect(screen.getByText("Viết Kudo")).toBeInTheDocument();

    fireEvent.mouseDown(document);

    expect(screen.queryByText("Viết Kudo")).not.toBeInTheDocument();
  });

  it("has aria-haspopup='menu'", () => {
    render(<FloatingActionButton />);

    expect(screen.getByLabelText("Quick actions")).toHaveAttribute(
      "aria-haspopup",
      "menu"
    );
  });

  it("menu items have role='menuitem'", () => {
    render(<FloatingActionButton />);
    fireEvent.click(screen.getByLabelText("Quick actions"));

    const menuItems = screen.getAllByRole("menuitem");
    expect(menuItems).toHaveLength(2);
  });
});
