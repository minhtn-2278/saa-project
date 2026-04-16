import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const { LanguageSelector } = await import(
  "@/components/login/LanguageSelector"
);

describe("LanguageSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset cookie
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "NEXT_LOCALE=vi",
    });
  });

  it("renders current locale with flag icon", () => {
    render(<LanguageSelector />);
    expect(screen.getByText("VN")).toBeInTheDocument();
  });

  it("has correct aria-label", () => {
    render(<LanguageSelector />);
    expect(
      screen.getByRole("button", { name: /select language/i })
    ).toBeInTheDocument();
  });

  it("has aria-expanded=false initially", () => {
    render(<LanguageSelector />);
    const button = screen.getByRole("button", { name: /select language/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("opens dropdown on click", () => {
    render(<LanguageSelector />);
    fireEvent.click(
      screen.getByRole("button", { name: /select language/i })
    );

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("sets aria-expanded=true when open", () => {
    render(<LanguageSelector />);
    const button = screen.getByRole("button", { name: /select language/i });
    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("shows 3 language options (VN, EN, JP)", () => {
    render(<LanguageSelector />);
    fireEvent.click(
      screen.getByRole("button", { name: /select language/i })
    );

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(screen.getByText("Tiếng Việt")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("日本語")).toBeInTheDocument();
  });

  it("closes on Escape key", () => {
    render(<LanguageSelector />);
    fireEvent.click(
      screen.getByRole("button", { name: /select language/i })
    );
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on click-outside", () => {
    render(<LanguageSelector />);
    fireEvent.click(
      screen.getByRole("button", { name: /select language/i })
    );
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.mouseDown(document);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("sets locale cookie on selection and refreshes", () => {
    render(<LanguageSelector />);
    fireEvent.click(
      screen.getByRole("button", { name: /select language/i })
    );

    fireEvent.click(screen.getByText("English"));

    expect(document.cookie).toContain("NEXT_LOCALE=en");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("supports keyboard navigation with ArrowDown to open", () => {
    render(<LanguageSelector />);
    const button = screen.getByRole("button", { name: /select language/i });

    fireEvent.keyDown(button.parentElement!, { key: "ArrowDown" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("supports Enter key to select option", () => {
    render(<LanguageSelector />);
    const container = screen.getByRole("button", {
      name: /select language/i,
    }).parentElement!;

    // Open with ArrowDown
    fireEvent.keyDown(container, { key: "ArrowDown" });
    // Navigate to English (index 1)
    fireEvent.keyDown(container, { key: "ArrowDown" });
    // Select with Enter
    fireEvent.keyDown(container, { key: "Enter" });

    expect(document.cookie).toContain("NEXT_LOCALE=en");
    expect(mockRefresh).toHaveBeenCalled();
  });
});
