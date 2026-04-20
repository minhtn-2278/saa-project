import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      toggleLabel: "Gửi lời cám ơn và ghi nhận ẩn danh",
    };
    return t[key] ?? key;
  },
}));

const { AnonymousCheckbox } = await import(
  "@/components/kudos/WriteKudoModal/AnonymousCheckbox"
);

describe("AnonymousCheckbox", () => {
  it("reflects the checked prop", () => {
    render(<AnonymousCheckbox checked onChange={() => {}} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("starts unchecked when checked=false", () => {
    render(<AnonymousCheckbox checked={false} onChange={() => {}} />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("calls onChange with the new boolean", () => {
    const onChange = vi.fn();
    render(<AnonymousCheckbox checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("disabled blocks interaction", () => {
    const onChange = vi.fn();
    render(<AnonymousCheckbox checked={false} onChange={onChange} disabled />);
    const cb = screen.getByRole("checkbox");
    expect(cb).toBeDisabled();
    fireEvent.click(cb);
    expect(onChange).not.toHaveBeenCalled();
  });
});
