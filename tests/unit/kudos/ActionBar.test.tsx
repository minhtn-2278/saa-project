import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      "actions.cancel": "Hủy",
      "actions.submit": "Gửi",
    };
    return t[key] ?? key;
  },
}));

const { ActionBar } = await import(
  "@/components/kudos/WriteKudoModal/ActionBar"
);

describe("ActionBar", () => {
  it("disables submit when canSubmit=false", () => {
    render(
      <ActionBar
        canSubmit={false}
        submitting={false}
        onCancel={() => {}}
        onSubmit={() => {}}
      />,
    );
    const submit = screen.getByRole("button", { name: "Gửi" });
    expect(submit).toBeDisabled();
  });

  it("enables submit when canSubmit=true", () => {
    render(
      <ActionBar
        canSubmit
        submitting={false}
        onCancel={() => {}}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Gửi" })).toBeEnabled();
  });

  it("disables both buttons while submitting (FR-012)", () => {
    render(
      <ActionBar
        canSubmit
        submitting
        onCancel={() => {}}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Gửi" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hủy" })).toBeDisabled();
  });

  it("invokes onSubmit on click", () => {
    const onSubmit = vi.fn();
    render(
      <ActionBar
        canSubmit
        submitting={false}
        onCancel={() => {}}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Gửi" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("invokes onCancel on Hủy click", () => {
    const onCancel = vi.fn();
    render(
      <ActionBar
        canSubmit={false}
        submitting={false}
        onCancel={onCancel}
        onSubmit={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
