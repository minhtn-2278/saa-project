import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, sizes, onError, ...rest } = props;
    return (
      <img
        {...rest}
        onError={onError as React.ReactEventHandler<HTMLImageElement>}
      />
    );
  },
}));

const { AwardImage } = await import("@/components/awards/AwardImage");

describe("AwardImage", () => {
  it("renders an image with correct src and alt (Latin name)", () => {
    render(<AwardImage src="/images/awards/top-talent.png" name="Top Talent" />);
    const img = screen.getByAltText("Top Talent");
    expect(img).toHaveAttribute("src", "/images/awards/top-talent.png");
  });

  it("has no border (design shows borderless thumbnails)", () => {
    const { container } = render(
      <AwardImage src="/images/awards/mvp.png" name="MVP" />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    // No border-* classes; the image itself carries the visual frame.
    expect(wrapper.className).not.toMatch(/\bborder\b/);
  });

  it("falls back to placeholder with overlay name on image error", () => {
    render(<AwardImage src="/broken.png" name="Top Talent" />);
    const img = screen.getByAltText("Top Talent");
    fireEvent.error(img);
    // After error, name text should be visible in overlay
    expect(screen.getAllByText("Top Talent").length).toBeGreaterThan(0);
  });
});
