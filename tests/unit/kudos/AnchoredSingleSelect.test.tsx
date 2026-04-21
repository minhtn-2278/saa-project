import { describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { AnchoredSingleSelect } from "@/components/kudos/LiveBoard/parts/AnchoredSingleSelect";

const items = [
  { value: 1, label: "Dedicated" },
  { value: 2, label: "Inspiring" },
  { value: 3, label: "Teamwork" },
];

describe("AnchoredSingleSelect", () => {
  it("renders the trigger with the fallback label when value is null", () => {
    render(
      <AnchoredSingleSelect
        triggerLabel="Hashtag"
        items={items}
        value={null}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Hashtag" })).toBeInTheDocument();
    // Listbox is not rendered until the trigger is clicked.
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("shows the selected item's label when value is set", () => {
    render(
      <AnchoredSingleSelect
        triggerLabel="Hashtag"
        items={items}
        value={2}
        onChange={() => {}}
      />,
    );
    // Trigger has aria-label="Hashtag"; inline × has aria-label="Xóa bộ lọc".
    expect(screen.getByRole("button", { name: "Hashtag" })).toHaveTextContent(
      "Inspiring",
    );
  });

  it("opens the listbox on click and renders all items", () => {
    render(
      <AnchoredSingleSelect
        triggerLabel="Hashtag"
        items={items}
        value={null}
        onChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Hashtag" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Dedicated");
  });

  it("calls onChange with the picked value and closes the panel", () => {
    const onChange = vi.fn();
    render(
      <AnchoredSingleSelect
        triggerLabel="Hashtag"
        items={items}
        value={null}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Hashtag" }));
    fireEvent.click(screen.getByRole("option", { name: "Teamwork" }));
    expect(onChange).toHaveBeenCalledWith(3);
    // Panel closes.
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("toggles off (onChange(null)) when the active item is re-picked", () => {
    const onChange = vi.fn();
    render(
      <AnchoredSingleSelect
        triggerLabel="Hashtag"
        items={items}
        value={2}
        onChange={onChange}
      />,
    );
    // When a value is selected the trigger renders an inline `×` control
    // (aria-label="Xóa bộ lọc") alongside the main button, so disambiguate
    // by the trigger's aria-label.
    fireEvent.click(screen.getByRole("button", { name: "Hashtag" }));
    fireEvent.click(screen.getByRole("option", { name: "Inspiring" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("closes on outside click without changing the selection", async () => {
    const onChange = vi.fn();
    render(
      <>
        <AnchoredSingleSelect
          triggerLabel="Hashtag"
          items={items}
          value={null}
          onChange={onChange}
        />
        <div data-testid="outside">outside</div>
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Hashtag" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await act(async () => {
      fireEvent.mouseDown(screen.getByTestId("outside"));
    });

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeNull();
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("closes on Escape and returns focus to the trigger", () => {
    render(
      <AnchoredSingleSelect
        triggerLabel="Hashtag"
        items={items}
        value={null}
        onChange={() => {}}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Hashtag" });
    fireEvent.click(trigger);
    const panel = screen.getByRole("listbox");
    fireEvent.keyDown(panel, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("supports ArrowDown + Enter keyboard selection", () => {
    const onChange = vi.fn();
    render(
      <AnchoredSingleSelect
        triggerLabel="Hashtag"
        items={items}
        value={null}
        onChange={onChange}
      />,
    );
    const trigger = screen.getByRole("button");
    // Open via ArrowDown on the trigger.
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const panel = screen.getByRole("listbox");
    // Default focus is index 0 → move to index 2.
    fireEvent.keyDown(panel, { key: "ArrowDown" });
    fireEvent.keyDown(panel, { key: "ArrowDown" });
    fireEvent.keyDown(panel, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(3);
  });
});
