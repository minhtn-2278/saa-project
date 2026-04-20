import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, string>) => {
    if (key === "actions.createNew" && vars?.label) {
      return `Tạo mới: "${vars.label}"`;
    }
    return key;
  },
}));

const { ComboboxCreateRow } = await import(
  "@/components/kudos/WriteKudoModal/parts/ComboboxCreateRow"
);

// Helper to wrap the <li> in a <ul> so the accessibility role reads correctly.
function Wrap({ children }: { children: React.ReactNode }) {
  return <ul>{children}</ul>;
}

describe("ComboboxCreateRow", () => {
  it('renders the "Tạo mới: {label}" text', () => {
    render(
      <Wrap>
        <ComboboxCreateRow label="team_work" onCreate={() => {}} />
      </Wrap>,
    );
    expect(screen.getByRole("option")).toHaveTextContent(
      'Tạo mới: "team_work"',
    );
  });

  it("invokes onCreate on mousedown when no helperError", () => {
    const onCreate = vi.fn();
    render(
      <Wrap>
        <ComboboxCreateRow label="new_tag" onCreate={onCreate} />
      </Wrap>,
    );
    fireEvent.mouseDown(screen.getByRole("option"));
    expect(onCreate).toHaveBeenCalledWith("new_tag");
  });

  it("disables interaction when helperError is set", () => {
    const onCreate = vi.fn();
    render(
      <Wrap>
        <ComboboxCreateRow
          label="bad tag"
          helperError="Chỉ gồm chữ…"
          onCreate={onCreate}
        />
      </Wrap>,
    );
    const opt = screen.getByRole("option");
    expect(opt).toHaveAttribute("aria-disabled", "true");
    fireEvent.mouseDown(opt);
    expect(onCreate).not.toHaveBeenCalled();
  });
});
