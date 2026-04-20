import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useKudoForm } from "@/components/kudos/WriteKudoModal/hooks/useKudoForm";
import type { ProseMirrorDoc } from "@/types/kudos";

const docOf = (text: string): ProseMirrorDoc => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

describe("useKudoForm reducer", () => {
  it("starts pristine with isDirty=false and isValid=false", () => {
    const { result } = renderHook(() => useKudoForm());
    expect(result.current.state.isDirty).toBe(false);
    expect(result.current.isValid).toBe(false);
  });

  it("SET_RECIPIENT marks the form dirty", () => {
    const { result } = renderHook(() => useKudoForm());
    act(() =>
      result.current.setRecipient({
        id: 1,
        fullName: "Alice",
        avatarUrl: null,
        department: null,
      }),
    );
    expect(result.current.state.isDirty).toBe(true);
    expect(result.current.state.recipient?.id).toBe(1);
  });

  it("becomes valid once recipient + title + body + ≥1 hashtag are set", () => {
    const { result } = renderHook(() => useKudoForm());
    act(() => {
      result.current.setRecipient({
        id: 1,
        fullName: "Alice",
        avatarUrl: null,
        department: null,
      });
      result.current.setTitle({ id: 10, name: "Người truyền động lực" });
      result.current.setBody(docOf("Cám ơn bạn"), "Cám ơn bạn");
      result.current.addHashtag({ id: 100, label: "team_work" });
    });
    expect(result.current.isValid).toBe(true);
  });

  it("caps hashtags at MAX (5) and ignores duplicates", () => {
    const { result } = renderHook(() => useKudoForm());
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.addHashtag({ id: i + 1, label: `t${i}` });
      }
    });
    expect(result.current.state.hashtags.length).toBe(5);

    act(() => {
      result.current.addHashtag({ id: 1, label: "t0" });
    });
    expect(result.current.state.hashtags.length).toBe(5);
  });

  it("REMOVE_HASHTAG drops the matching id", () => {
    const { result } = renderHook(() => useKudoForm());
    act(() => {
      result.current.addHashtag({ id: 1, label: "a" });
      result.current.addHashtag({ id: 2, label: "b" });
      result.current.removeHashtag(1);
    });
    expect(result.current.state.hashtags.map((h) => h.id)).toEqual([2]);
  });

  it("RESET returns to the initial state", () => {
    const { result } = renderHook(() => useKudoForm());
    act(() => {
      result.current.setRecipient({
        id: 1,
        fullName: "Alice",
        avatarUrl: null,
        department: null,
      });
      result.current.reset();
    });
    expect(result.current.state.recipient).toBeNull();
    expect(result.current.state.isDirty).toBe(false);
  });

  it("RESTORE hydrates partial state and keeps isDirty=false", () => {
    const { result } = renderHook(() => useKudoForm());
    act(() =>
      result.current.restore({
        recipient: {
          id: 9,
          fullName: "Bob",
          avatarUrl: null,
          department: null,
        },
        body: docOf("draft"),
        bodyPlain: "draft",
      }),
    );
    expect(result.current.state.bodyPlain).toBe("draft");
    expect(result.current.state.recipient?.id).toBe(9);
    expect(result.current.state.isDirty).toBe(false);
  });
});
