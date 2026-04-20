import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      title: "Huỷ Kudo?",
      message: "Thay đổi sẽ không được lưu.",
      confirm: "Xác nhận huỷ",
      abort: "Giữ lại",
    };
    return t[key] ?? key;
  },
}));

const { CancelConfirmDialog } = await import(
  "@/components/kudos/WriteKudoModal/CancelConfirmDialog"
);

describe("CancelConfirmDialog", () => {
  it("does not render when closed", () => {
    render(
      <CancelConfirmDialog open={false} onOpenChange={() => {}} onConfirm={() => {}} />,
    );
    expect(screen.queryByText("Huỷ Kudo?")).toBeNull();
  });

  it("renders title + message when open", () => {
    render(
      <CancelConfirmDialog open onOpenChange={() => {}} onConfirm={() => {}} />,
    );
    expect(screen.getByText("Huỷ Kudo?")).toBeInTheDocument();
    expect(screen.getByText("Thay đổi sẽ không được lưu.")).toBeInTheDocument();
  });

  it("abort button calls onOpenChange(false)", () => {
    const onOpenChange = vi.fn();
    render(
      <CancelConfirmDialog open onOpenChange={onOpenChange} onConfirm={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Giữ lại" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("confirm button calls onConfirm", () => {
    const onConfirm = vi.fn();
    render(
      <CancelConfirmDialog open onOpenChange={() => {}} onConfirm={onConfirm} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận huỷ" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
