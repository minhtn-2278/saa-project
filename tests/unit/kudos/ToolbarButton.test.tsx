import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ToolbarButton } from "@/components/kudos/WriteKudoModal/parts/ToolbarButton";

describe("ToolbarButton", () => {
  it("reflects active state via aria-pressed", () => {
    render(
      <ToolbarButton active ariaLabel="Bold" onClick={() => {}}>
        B
      </ToolbarButton>,
    );
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("defaults to aria-pressed=false", () => {
    render(
      <ToolbarButton active={false} ariaLabel="Italic" onClick={() => {}}>
        I
      </ToolbarButton>,
    );
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("invokes onClick once per click", () => {
    const onClick = vi.fn();
    render(
      <ToolbarButton active={false} ariaLabel="Strike" onClick={onClick}>
        S
      </ToolbarButton>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Strike" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled prop wins over onClick", () => {
    const onClick = vi.fn();
    render(
      <ToolbarButton active={false} ariaLabel="Link" onClick={onClick} disabled>
        L
      </ToolbarButton>,
    );
    const btn = screen.getByRole("button", { name: "Link" });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies first/last positional rounding utility classes", () => {
    const { rerender } = render(
      <ToolbarButton active ariaLabel="Bold" onClick={() => {}} position="first">
        B
      </ToolbarButton>,
    );
    expect(screen.getByRole("button", { name: "Bold" }).className).toContain(
      "rounded-tl-lg",
    );
    rerender(
      <ToolbarButton active ariaLabel="Bold" onClick={() => {}} position="last">
        B
      </ToolbarButton>,
    );
    expect(screen.getByRole("button", { name: "Bold" }).className).toContain(
      "rounded-tr-lg",
    );
  });
});
