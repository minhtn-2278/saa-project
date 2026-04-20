import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ImageDraft } from "@/components/kudos/WriteKudoModal/hooks/useKudoForm";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      "fields.image.label": "Image",
      "fields.image.addCta": "Image",
      "fields.image.maxHint": "Tối đa 5",
      "errors.image.invalid": "invalid",
      "errors.image.uploadFailed": "upload failed",
    };
    return t[key] ?? key;
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const { ImageUploader } = await import(
  "@/components/kudos/WriteKudoModal/ImageUploader"
);

describe("ImageUploader", () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;

  beforeEach(() => {
    originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:fake");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    vi.restoreAllMocks();
  });

  function renderUploader(images: ImageDraft[] = []) {
    const onAdd = vi.fn();
    const onRemoveByFile = vi.fn();
    render(
      <ImageUploader
        images={images}
        onAdd={onAdd}
        onRemoveByFile={onRemoveByFile}
      />,
    );
    return { onAdd, onRemoveByFile };
  }

  it("renders the + Image button when below the 5-image limit", () => {
    renderUploader();
    expect(screen.getByRole("button", { name: "Image" })).toBeInTheDocument();
  });

  it("hides the + Image button when images hit the max (5)", () => {
    const full: ImageDraft[] = Array.from({ length: 5 }).map((_, i) => ({
      file: new File([new Uint8Array([1])], `f${i}.jpg`, { type: "image/jpeg" }),
      previewUrl: "blob:fake",
    }));
    renderUploader(full);
    expect(screen.queryByRole("button", { name: "Image" })).toBeNull();
  });

  it("rejects a file with invalid MIME and does NOT call onAdd", () => {
    const { onAdd } = renderUploader();
    const input = screen
      .getByRole("button", { name: "Image" })
      .parentElement!.querySelector("input[type=file]") as HTMLInputElement;
    const bad = new File([new Uint8Array([1, 2, 3])], "doc.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [bad] } });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("adds a valid JPG as a local draft WITHOUT any network call", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { onAdd } = renderUploader();
    const input = screen
      .getByRole("button", { name: "Image" })
      .parentElement!.querySelector("input[type=file]") as HTMLInputElement;
    const ok = new File([new Uint8Array([1, 2, 3])], "pic.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(input, { target: { files: [ok] } });
    expect(onAdd).toHaveBeenCalledTimes(1);
    const draft = onAdd.mock.calls[0][0] as ImageDraft;
    expect(draft.file).toBe(ok);
    expect(draft.previewUrl).toBe("blob:fake");
    // Picking MUST NOT perform any upload — that moves to submit time.
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
