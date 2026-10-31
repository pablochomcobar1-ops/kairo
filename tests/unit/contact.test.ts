import { describe, expect, it } from "vitest";
import { sendContactCore, type ContactRow } from "@/server/contact/core";

function fakeStore(failNotify = false) {
  const rows: ContactRow[] = [];
  const mails: ContactRow[] = [];
  return {
    rows,
    mails,
    store: {
      insert: async (r: ContactRow) => void rows.push(r),
      notify: async (r: ContactRow) => {
        if (failNotify) throw new Error("mail down");
        mails.push(r);
      },
    },
  };
}
const ok = {
  name: "Arjun Mehta",
  email: " Arjun@Example.com ",
  phone: "+91 98765 43210",
  message: "Is the Boardroom Blazer fully lined?",
};

describe("contact messages", () => {
  it("saves a clean message (email lower-cased, phone normalised)", async () => {
    const { store, rows, mails } = fakeStore();
    const r = await sendContactCore(store, ok);
    expect(r).toMatchObject({ status: "ok", saved: true });
    expect(rows[0]).toEqual({
      name: "Arjun Mehta",
      email: "arjun@example.com",
      phone: "9876543210",
      message: ok.message,
    });
    expect(mails).toHaveLength(1);
  });

  it("phone is optional", async () => {
    const { store, rows } = fakeStore();
    await sendContactCore(store, { ...ok, phone: "" });
    expect(rows[0].phone).toBeNull();
  });

  it("rejects bad fields and saves nothing", async () => {
    const { store, rows } = fakeStore();
    const r = await sendContactCore(store, { ...ok, email: "nope", message: "hi" });
    expect(r.status === "error" && r.fields).toMatchObject({
      email: expect.any(String),
      message: expect.any(String),
    });
    expect(rows).toHaveLength(0);
  });

  it("a bot filling the hidden field is thanked but nothing is saved", async () => {
    const { store, rows } = fakeStore();
    expect(await sendContactCore(store, { ...ok, website: "http://spam" })).toMatchObject({
      status: "ok",
      saved: false,
    });
    expect(rows).toHaveLength(0);
  });

  it("a failed email copy never loses the message", async () => {
    const { store, rows } = fakeStore(true);
    expect((await sendContactCore(store, ok)).status).toBe("ok");
    expect(rows).toHaveLength(1);
  });
});
