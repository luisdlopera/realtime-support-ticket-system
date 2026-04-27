import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StatusBadge } from "@/components/tickets/status-badge";

describe("StatusBadge", () => {
  it("renders OPEN status correctly", () => {
    const { getByText } = render(<StatusBadge status="OPEN" />);
    expect(getByText("Abierto")).toBeInTheDocument();
  });

  it("renders CLOSED status correctly", () => {
    const { getByText } = render(<StatusBadge status="CLOSED" />);
    expect(getByText("Cerrado")).toBeInTheDocument();
  });

  it("renders IN_PROGRESS status correctly", () => {
    const { getByText } = render(<StatusBadge status="IN_PROGRESS" />);
    expect(getByText("En progreso")).toBeInTheDocument();
  });

  it("renders RESOLVED status correctly", () => {
    const { getByText } = render(<StatusBadge status="RESOLVED" />);
    expect(getByText("Resuelto")).toBeInTheDocument();
  });
});
