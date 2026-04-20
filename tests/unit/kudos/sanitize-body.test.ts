import { describe, it, expect } from "vitest";
import {
  sanitizeBody,
  extractBodyPlain,
  extractMentionIds,
} from "@/lib/kudos/sanitize-body";
import type { ProseMirrorDoc } from "@/types/kudos";

function doc(content: unknown[]): ProseMirrorDoc {
  return { type: "doc", content: content as ProseMirrorDoc["content"] };
}

describe("sanitizeBody — allow-listed nodes and marks", () => {
  it("passes through a plain paragraph", () => {
    const { body, bodyPlain } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [{ type: "text", text: "Cảm ơn bạn" }],
        },
      ]),
    );
    expect(body.content?.[0].content?.[0].text).toBe("Cảm ơn bạn");
    expect(bodyPlain).toBe("Cảm ơn bạn");
  });

  it("keeps allowed marks (bold, italic, strike)", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "hello",
              marks: [{ type: "bold" }, { type: "italic" }, { type: "strike" }],
            },
          ],
        },
      ]),
    );
    const marks = body.content?.[0].content?.[0].marks ?? [];
    expect(marks.map((m) => m.type).sort()).toEqual(["bold", "italic", "strike"]);
  });

  it("keeps bullet list + list item", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "bullet_list",
          content: [
            {
              type: "list_item",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "a" }] },
              ],
            },
          ],
        },
      ]),
    );
    expect(body.content?.[0].type).toBe("bullet_list");
    expect(body.content?.[0].content?.[0].type).toBe("list_item");
  });
});

describe("sanitizeBody — strips disallowed nodes and marks", () => {
  it("strips <script>-like node types entirely", () => {
    const { body } = sanitizeBody(
      doc([
        { type: "script", content: [{ type: "text", text: "alert(1)" }] },
        { type: "paragraph", content: [{ type: "text", text: "ok" }] },
      ]),
    );
    expect(body.content).toHaveLength(1);
    expect(body.content?.[0].type).toBe("paragraph");
  });

  it("strips unknown mark types", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "x",
              marks: [{ type: "onerror" }, { type: "bold" }],
            },
          ],
        },
      ]),
    );
    const marks = body.content?.[0].content?.[0].marks ?? [];
    expect(marks.map((m) => m.type)).toEqual(["bold"]);
  });

  it("strips links with javascript: hrefs", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "click",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ]),
    );
    expect(body.content?.[0].content?.[0].marks).toBeUndefined();
  });

  it("strips links with data: hrefs", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "x",
              marks: [{ type: "link", attrs: { href: "data:text/html,<script>1</script>" } }],
            },
          ],
        },
      ]),
    );
    expect(body.content?.[0].content?.[0].marks).toBeUndefined();
  });

  it("strips links with disallowed external domains", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "x",
              marks: [{ type: "link", attrs: { href: "https://evil.example.com/" } }],
            },
          ],
        },
      ]),
    );
    expect(body.content?.[0].content?.[0].marks).toBeUndefined();
  });

  it("keeps links with internal /profile/ prefix", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Minh",
              marks: [{ type: "link", attrs: { href: "/profile/123" } }],
            },
          ],
        },
      ]),
    );
    const marks = body.content?.[0].content?.[0].marks;
    expect(marks?.[0].type).toBe("link");
    expect(marks?.[0].attrs?.href).toBe("/profile/123");
    expect(marks?.[0].attrs?.rel).toBe("noopener noreferrer");
    expect(marks?.[0].attrs?.target).toBe("_blank");
  });

  it("keeps links with https://saa.sun-asterisk.com/ prefix", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "x",
              marks: [{ type: "link", attrs: { href: "https://saa.sun-asterisk.com/kudos" } }],
            },
          ],
        },
      ]),
    );
    expect(body.content?.[0].content?.[0].marks?.[0].attrs?.href).toBe(
      "https://saa.sun-asterisk.com/kudos",
    );
  });
});

describe("sanitizeBody — mention attrs", () => {
  it("keeps valid mention node", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [
            { type: "mention", attrs: { id: 42, label: "Nguyen Van A" } },
          ],
        },
      ]),
    );
    expect(body.content?.[0].content?.[0].type).toBe("mention");
    expect(body.content?.[0].content?.[0].attrs).toEqual({
      id: 42,
      label: "Nguyen Van A",
    });
  });

  it("strips mention with non-integer id", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [{ type: "mention", attrs: { id: "42", label: "x" } }],
        },
      ]),
    );
    expect(body.content?.[0].content).toBeUndefined();
  });

  it("strips mention with missing label", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [{ type: "mention", attrs: { id: 1 } }],
        },
      ]),
    );
    expect(body.content?.[0].content).toBeUndefined();
  });
});

describe("sanitizeBody — malformed input", () => {
  it("returns empty doc for null / non-doc input", () => {
    expect(sanitizeBody(null).body).toEqual({ type: "doc", content: [] });
    expect(sanitizeBody({ type: "paragraph" }).body).toEqual({
      type: "doc",
      content: [],
    });
    expect(sanitizeBody("a string").body).toEqual({ type: "doc", content: [] });
  });
});

describe("extractBodyPlain", () => {
  it("joins text nodes across paragraphs with newlines", () => {
    expect(
      extractBodyPlain(
        doc([
          { type: "paragraph", content: [{ type: "text", text: "hello" }] },
          { type: "paragraph", content: [{ type: "text", text: "world" }] },
        ]),
      ),
    ).toBe("hello\nworld");
  });

  it("renders mention as @label", () => {
    expect(
      extractBodyPlain(
        doc([
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Cảm ơn " },
              { type: "mention", attrs: { id: 1, label: "Minh" } },
            ],
          },
        ]),
      ),
    ).toBe("Cảm ơn @Minh");
  });

  it("trims leading/trailing whitespace", () => {
    expect(
      extractBodyPlain(
        doc([{ type: "paragraph", content: [{ type: "text", text: "  hi  " }] }]),
      ),
    ).toBe("hi");
  });
});

// -----------------------------------------------------------------------------
// T093 — Phase 4 additions: link allow-list + event handlers + mention ids
// -----------------------------------------------------------------------------

describe("sanitizeBody — link allow-list (TR-006)", () => {
  it("strips external href", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "x",
              marks: [{ type: "link", attrs: { href: "https://evil.com/" } }],
            },
          ],
        },
      ]),
    );
    const marks = body.content?.[0]?.content?.[0]?.marks;
    expect(marks ?? []).toEqual([]);
  });

  it("keeps /profile/ href", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "x",
              marks: [{ type: "link", attrs: { href: "/profile/42" } }],
            },
          ],
        },
      ]),
    );
    const marks = body.content?.[0]?.content?.[0]?.marks;
    expect(marks?.[0]).toMatchObject({
      type: "link",
      attrs: { href: "/profile/42", rel: "noopener noreferrer", target: "_blank" },
    });
  });

  it("keeps https://saa.sun-asterisk.com/ href", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "x",
              marks: [
                { type: "link", attrs: { href: "https://saa.sun-asterisk.com/rules" } },
              ],
            },
          ],
        },
      ]),
    );
    const mark = body.content?.[0]?.content?.[0]?.marks?.[0];
    expect(mark?.attrs?.href).toBe("https://saa.sun-asterisk.com/rules");
  });

  it("strips javascript: and data: hrefs", () => {
    for (const bad of ["javascript:alert(1)", "  JavaScript:void(0)", "data:text/html,x"]) {
      const { body } = sanitizeBody(
        doc([
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "x",
                marks: [{ type: "link", attrs: { href: bad } }],
              },
            ],
          },
        ]),
      );
      expect(body.content?.[0]?.content?.[0]?.marks ?? []).toEqual([]);
    }
  });

  it("strips <script> nodes entirely", () => {
    const { body } = sanitizeBody(
      doc([
        { type: "script", content: [{ type: "text", text: "alert(1)" }] },
        { type: "paragraph", content: [{ type: "text", text: "ok" }] },
      ]),
    );
    expect(body.content).toHaveLength(1);
    expect(body.content?.[0]?.type).toBe("paragraph");
  });
});

describe("sanitizeBody — mention attrs tampering", () => {
  it("drops mention with non-number id", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [
            { type: "mention", attrs: { id: "42", label: "X" } },
            { type: "text", text: "y" },
          ],
        },
      ]),
    );
    expect(body.content?.[0]?.content?.map((n) => n.type)).toEqual(["text"]);
  });

  it("drops mention with id <= 0", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [{ type: "mention", attrs: { id: 0, label: "X" } }],
        },
      ]),
    );
    expect(body.content?.[0]?.content ?? []).toEqual([]);
  });

  it("drops mention with empty label", () => {
    const { body } = sanitizeBody(
      doc([
        {
          type: "paragraph",
          content: [{ type: "mention", attrs: { id: 5 } }],
        },
      ]),
    );
    expect(body.content?.[0]?.content ?? []).toEqual([]);
  });
});

describe("extractMentionIds", () => {
  it("returns an empty array when there are no mentions", () => {
    const d = doc([
      { type: "paragraph", content: [{ type: "text", text: "plain" }] },
    ]);
    expect(extractMentionIds(d)).toEqual([]);
  });

  it("collects unique ids preserving first-seen order", () => {
    const d = doc([
      {
        type: "paragraph",
        content: [
          { type: "mention", attrs: { id: 3, label: "C" } },
          { type: "text", text: " " },
          { type: "mention", attrs: { id: 1, label: "A" } },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "mention", attrs: { id: 3, label: "C dup" } },
          { type: "mention", attrs: { id: 2, label: "B" } },
        ],
      },
    ]);
    expect(extractMentionIds(d)).toEqual([3, 1, 2]);
  });
});
