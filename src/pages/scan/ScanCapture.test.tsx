// ScanCapture regression test — the "infinite Saving…" bug.
//
// Repro: after the first photo, handleFile saved + advanced the angle but
// never reset `busy`, so the button stayed disabled on "Saving…" forever and
// the user could not take the next photo. This locks in that the button
// re-enables after a non-final capture.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { ScanCapture } from "./ScanCapture";

// Encryption + persistence are exercised elsewhere; here we only care about
// the capture-flow state machine, so stub the storage layer to resolve fast.
vi.mock("../../lib/scan-storage", () => ({
  encryptImage: vi.fn().mockResolvedValue({ ciphertextB64: "ct", ivB64: "iv" }),
  decryptImage: vi.fn().mockResolvedValue(new Uint8Array([1])),
  saveScan: vi.fn(),
  listScans: vi.fn().mockReturnValue([]),
  newRecordId: vi.fn().mockReturnValue("rec_1"),
  newSessionId: vi.fn().mockReturnValue("sess_1"),
}));

vi.mock("../../lib/api", () => ({
  api: { analyzeScan: vi.fn().mockResolvedValue({}) },
}));

function renderCapture() {
  return render(
    <MemoryRouter initialEntries={["/scan/capture"]}>
      <ScanCapture />
    </MemoryRouter>,
  );
}

function takePhoto() {
  // The visible button just clicks the hidden file input; drive the input
  // directly with a fake file to simulate a capture.
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type: "image/jpeg" });
  Object.defineProperty(file, "arrayBuffer", {
    value: () => Promise.resolve(new ArrayBuffer(3)),
  });
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ScanCapture", () => {
  it("re-enables the button after a non-final photo (no stuck 'Saving…')", async () => {
    renderCapture();

    // Starts on the front view, button enabled.
    expect(screen.getByText(/scan 1 of 3/i)).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /take front/i });
    expect(btn).not.toBeDisabled();

    takePhoto();

    // After the first save it must advance to the side view AND the capture
    // button must be enabled again — the regression was it staying disabled
    // on "Saving…" forever.
    await waitFor(() => expect(screen.getByText(/scan 2 of 3/i)).toBeInTheDocument());
    const next = screen.getByRole("button", { name: /take side/i });
    expect(next).not.toBeDisabled();
    expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
  });
});
