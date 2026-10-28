import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";

describe("Button", () => {
  it("is busy and unclickable while loading, and says so to screen readers", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Add to bag
      </Button>,
    );
    const btn = screen.getByRole("button", { name: /add to bag/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");
  });
});

describe("IconButton", () => {
  it("always has an accessible name", () => {
    render(<IconButton label="Open bag" icon={<svg />} />);
    expect(screen.getByRole("button", { name: "Open bag" })).toBeInTheDocument();
  });
});

describe("Price", () => {
  it("shows a plain price", () => {
    render(<Price paise={1490000} />);
    expect(screen.getByText("₹14,900")).toBeInTheDocument();
  });

  it("explains a reduced price to screen readers, not just with a strike-through", () => {
    render(<Price paise={890000} compareAtPaise={990000} />);
    expect(screen.getByText("Was ₹9,900, now ₹8,900")).toBeInTheDocument();
  });
});

describe("Badge", () => {
  it("renders the Sample tag used on seeded reviews", () => {
    render(<Badge tone="sample">Sample</Badge>);
    expect(screen.getByText("Sample")).toBeInTheDocument();
  });
});

describe("Input", () => {
  it("links its label, hint and error so screen readers read them", () => {
    render(<Input label="Pincode" hint="6 digits" error="Enter a valid pincode" />);
    const input = screen.getByLabelText("Pincode");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("6 digits Enter a valid pincode");
  });

  it("is not marked invalid without an error", () => {
    render(<Input label="Name" />);
    expect(screen.getByLabelText("Name")).not.toHaveAttribute("aria-invalid");
  });
});

describe("Dialog", () => {
  it("opens from its trigger, closes on Escape and returns focus", async () => {
    const user = userEvent.setup();
    render(
      <Dialog title="Size guide" trigger={<button type="button">Size guide</button>}>
        <p>Chest 38–40 in</p>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Size guide" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Size guide" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
