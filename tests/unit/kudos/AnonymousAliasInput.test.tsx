import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      aliasLabel: "Tên ẩn danh",
      aliasPlaceholder: "Nhập tên hiển thị khi gửi ẩn danh",
      "anonymousAlias.maxLength": "Tối đa 60 ký tự",
    };
    return t[key] ?? key;
  },
}));

const { AnonymousAliasInput } = await import(
  "@/components/kudos/WriteKudoModal/AnonymousAliasInput"
);

describe("AnonymousAliasInput", () => {
  it("does not render the input when visible=false", () => {
    render(
      <AnonymousAliasInput visible={false} value="" onChange={() => {}} />,
    );
    expect(screen.queryByPlaceholderText(/Nhập tên hiển thị/)).toBeNull();
  });

  it("renders the input + placeholder when visible", () => {
    render(<AnonymousAliasInput visible value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText(/Nhập tên hiển thị/)).toBeInTheDocument();
  });

  it("counter shows codepoint length (surrogate pairs count as 1)", () => {
    render(
      <AnonymousAliasInput visible value="🐇" onChange={() => {}} />,
    );
    expect(screen.getByText("1 / 60")).toBeInTheDocument();
  });

  it("shows maxLength error when alias exceeds 60 codepoints", () => {
    const long = "a".repeat(61);
    render(<AnonymousAliasInput visible value={long} onChange={() => {}} />);
    expect(screen.getByText(/Tối đa 60 ký tự/)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("onChange forwards the new value", () => {
    const onChange = vi.fn();
    render(<AnonymousAliasInput visible value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Thỏ 7 màu" },
    });
    expect(onChange).toHaveBeenCalledWith("Thỏ 7 màu");
  });
});
