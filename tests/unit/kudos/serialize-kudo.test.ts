import { describe, it, expect } from "vitest";
import {
  serializeKudo,
  ANONYMOUS_SENDER_FALLBACK,
} from "@/lib/kudos/serialize-kudo";
import type {
  EmployeeRow,
  HashtagRow,
  KudoRow,
  TitleRow,
} from "@/types/kudos";

const author: EmployeeRow = {
  id: 1,
  email: "tran.nhat.minh@sun-asterisk.com",
  full_name: "Trần Nhật Minh",
  employee_code: "SA-10001",
  department: "Engineering",
  job_title: "Senior Software Engineer",
  avatar_url: "https://cdn.example.com/minh.jpg",
  is_admin: false,
  deleted_at: null,
};

const recipient: EmployeeRow = {
  id: 2,
  email: "nguyen.thi.an@sun-asterisk.com",
  full_name: "Nguyễn Thị An",
  employee_code: "SA-10002",
  department: "Engineering",
  job_title: "Software Engineer",
  avatar_url: "https://cdn.example.com/an.jpg",
  is_admin: false,
  deleted_at: null,
};

const title: TitleRow = {
  id: 10,
  name: "Người truyền động lực cho tôi",
  slug: "nguoi-truyen-dong-luc-cho-toi",
  description: "Đồng nghiệp luôn tạo năng lượng tích cực.",
  icon: null,
  sort_order: 10,
  created_by: null,
  deleted_at: null,
};

const hashtag: HashtagRow = {
  id: 100,
  label: "teamwork",
  slug: "teamwork",
  usage_count: 45,
  created_by: null,
  deleted_at: null,
};

function baseKudo(overrides: Partial<KudoRow> = {}): KudoRow {
  return {
    id: 999,
    author_id: author.id,
    recipient_id: recipient.id,
    title_id: title.id,
    body: { type: "doc", content: [] },
    body_plain: "Cảm ơn bạn",
    is_anonymous: false,
    anonymous_alias: null,
    status: "published",
    created_at: "2026-04-20T10:00:00Z",
    updated_at: "2026-04-20T10:00:00Z",
    deleted_at: null,
    ...overrides,
  };
}

const deps = (overrides: Partial<Parameters<typeof serializeKudo>[1]> = {}) => ({
  employeesById: new Map([
    [author.id, author],
    [recipient.id, recipient],
  ]),
  title,
  hashtags: [hashtag],
  images: [],
  mentionEmployeeIds: [],
  ...overrides,
});

describe("serializeKudo — non-anonymous", () => {
  it("returns author's full name + avatar as sender", () => {
    const out = serializeKudo(baseKudo(), deps());
    expect(out.senderName).toBe("Trần Nhật Minh");
    expect(out.senderAvatarUrl).toBe("https://cdn.example.com/minh.jpg");
    expect(out.isAnonymous).toBe(false);
  });

  it("never exposes author_id on the wire", () => {
    const out = serializeKudo(baseKudo(), deps());
    const asRecord = out as unknown as Record<string, unknown>;
    expect(asRecord.author_id).toBeUndefined();
    expect(asRecord.authorId).toBeUndefined();
    expect(asRecord.author).toBeUndefined();
  });

  it("returns recipient data", () => {
    const out = serializeKudo(baseKudo(), deps());
    expect(out.recipientId).toBe(recipient.id);
    expect(out.recipientName).toBe("Nguyễn Thị An");
    expect(out.recipientAvatarUrl).toBe("https://cdn.example.com/an.jpg");
  });
});

describe("serializeKudo — anonymous with alias", () => {
  it("returns the alias as senderName", () => {
    const out = serializeKudo(
      baseKudo({ is_anonymous: true, anonymous_alias: "Thỏ 7 màu" }),
      deps(),
    );
    expect(out.senderName).toBe("Thỏ 7 màu");
    expect(out.senderAvatarUrl).toBeNull();
    expect(out.isAnonymous).toBe(true);
  });

  it("trims surrounding whitespace from alias", () => {
    const out = serializeKudo(
      baseKudo({ is_anonymous: true, anonymous_alias: "  Thỏ  " }),
      deps(),
    );
    expect(out.senderName).toBe("Thỏ");
  });

  it("never exposes author_id", () => {
    const out = serializeKudo(
      baseKudo({ is_anonymous: true, anonymous_alias: "alias" }),
      deps(),
    );
    expect(JSON.stringify(out)).not.toContain(`"author_id"`);
    expect(JSON.stringify(out)).not.toContain(`"authorId"`);
  });
});

describe("serializeKudo — anonymous with empty alias", () => {
  it("falls back to 'Ẩn danh'", () => {
    const out = serializeKudo(
      baseKudo({ is_anonymous: true, anonymous_alias: null }),
      deps(),
    );
    expect(out.senderName).toBe(ANONYMOUS_SENDER_FALLBACK);
    expect(out.senderAvatarUrl).toBeNull();
  });

  it("falls back when alias is whitespace only", () => {
    const out = serializeKudo(
      baseKudo({ is_anonymous: true, anonymous_alias: "   " }),
      deps(),
    );
    expect(out.senderName).toBe(ANONYMOUS_SENDER_FALLBACK);
  });
});

describe("serializeKudo — mentions", () => {
  it("resolves mention ids to employee rows; skips missing ones", () => {
    const mentioned: EmployeeRow = {
      ...recipient,
      id: 3,
      email: "pham.van.bach@sun-asterisk.com",
      full_name: "Phạm Văn Bách",
    };
    const out = serializeKudo(
      baseKudo(),
      deps({
        employeesById: new Map([
          [author.id, author],
          [recipient.id, recipient],
          [mentioned.id, mentioned],
        ]),
        mentionEmployeeIds: [mentioned.id, 999 /* unknown */],
      }),
    );
    expect(out.mentions).toHaveLength(1);
    expect(out.mentions[0].fullName).toBe("Phạm Văn Bách");
  });
});

describe("serializeKudo — error paths", () => {
  it("throws when recipient is missing from employeesById", () => {
    expect(() =>
      serializeKudo(
        baseKudo(),
        deps({ employeesById: new Map([[author.id, author]]) }),
      ),
    ).toThrow(/recipient/);
  });

  it("throws when non-anonymous author is missing from employeesById", () => {
    expect(() =>
      serializeKudo(
        baseKudo(),
        deps({ employeesById: new Map([[recipient.id, recipient]]) }),
      ),
    ).toThrow(/author/);
  });

  it("does NOT throw when anonymous + author missing (author is never read)", () => {
    expect(() =>
      serializeKudo(
        baseKudo({ is_anonymous: true, anonymous_alias: "X" }),
        deps({ employeesById: new Map([[recipient.id, recipient]]) }),
      ),
    ).not.toThrow();
  });
});
