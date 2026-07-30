"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import { PillButton } from "@/components/PillButton";

type TeamMemberInput = { name: string; role: string; blurb: string };

const inputClass =
  "w-full mt-1 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-[14px]";
const labelClass = "text-[13px] font-medium text-[var(--color-muted)]";

export default function NewClientPage() {
  const [clientSlug, setClientSlug] = useState("");
  const [clientName, setClientName] = useState("");
  const [engagementTitle, setEngagementTitle] = useState("");
  const [totalFee, setTotalFee] = useState("");
  const [finalDeliveryDate, setFinalDeliveryDate] = useState("");
  const [clientSignatoryName, setClientSignatoryName] = useState("");
  const [clientSignatoryEmail, setClientSignatoryEmail] = useState("");
  const [transcript, setTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [team, setTeam] = useState<TeamMemberInput[]>([
    { name: "Tom Abrams", role: "Founder, Creative Director", blurb: "" },
  ]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  function updateTeamMember(
    index: number,
    field: keyof TeamMemberInput,
    value: string,
  ) {
    setTeam((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorDetail(null);

    const formData = new FormData();
    formData.append(
      "engagement",
      JSON.stringify({
        clientSlug,
        clientName,
        engagementTitle,
        totalFee,
        finalDeliveryDate,
        clientSignatoryName,
        clientSignatoryEmail,
        transcript,
        notes,
        team,
      }),
    );
    if (pdfFile) formData.append("pdf", pdfFile);

    const res = await fetch("/api/admin/create-engagement", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorDetail(data.error || "Something went wrong.");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <main className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="px-9 py-10 text-center">
            <h1 className="text-[20px] font-bold text-[var(--color-ink)] mb-2">
              Client created
            </h1>
            <p className="text-[14px] text-[var(--color-muted)]">
              Portal link: <strong>/portal/{clientSlug}</strong>
            </p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-cream)] py-12 px-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto space-y-5"
      >
        <Card className="px-9 py-9">
          <h1 className="text-[19px] font-bold text-[var(--color-ink)] mb-6">
            New client engagement
          </h1>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Company name</label>
              <input
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className={inputClass}
                placeholder="Coros"
              />
            </div>
            <div>
              <label className={labelClass}>
                Portal slug (used in the link)
              </label>
              <input
                required
                value={clientSlug}
                onChange={(e) => setClientSlug(e.target.value)}
                className={inputClass}
                placeholder="coros"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className={labelClass}>Engagement title</label>
            <input
              required
              value={engagementTitle}
              onChange={(e) => setEngagementTitle(e.target.value)}
              className={inputClass}
              placeholder="Dura 2 Software Storytelling System"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Total fee</label>
              <input
                required
                value={totalFee}
                onChange={(e) => setTotalFee(e.target.value)}
                className={inputClass}
                placeholder="$12,000"
              />
            </div>
            <div>
              <label className={labelClass}>Final delivery date</label>
              <input
                required
                value={finalDeliveryDate}
                onChange={(e) => setFinalDeliveryDate(e.target.value)}
                className={inputClass}
                placeholder="August 30, 2026"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Client signatory name</label>
              <input
                required
                value={clientSignatoryName}
                onChange={(e) => setClientSignatoryName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Client signatory email</label>
              <input
                required
                type="email"
                value={clientSignatoryEmail}
                onChange={(e) => setClientSignatoryEmail(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mb-2">
            <label className={labelClass}>
              Final SOW + MSA PDF (merged into one file)
            </label>
            <input
              required
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              className="w-full mt-1 text-[13px]"
            />
          </div>
        </Card>

        <Card className="px-9 py-9">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-4">
            Account team
          </h2>
          {team.map((member, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 mb-3">
              <input
                value={member.name}
                onChange={(e) => updateTeamMember(i, "name", e.target.value)}
                className={inputClass}
                placeholder="Name"
              />
              <input
                value={member.role}
                onChange={(e) => updateTeamMember(i, "role", e.target.value)}
                className={inputClass}
                placeholder="Role"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setTeam((prev) => [...prev, { name: "", role: "", blurb: "" }])
            }
            className="text-[13px] font-medium text-[var(--color-ink)] underline"
          >
            + Add team member
          </button>
        </Card>

        <Card className="px-9 py-9">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)] mb-1">
            Reference material
          </h2>
          <p className="text-[13px] text-[var(--color-muted)] mb-4">
            Kept for the record — not shown to the client, not used by the
            portal itself.
          </p>
          <div className="mb-4">
            <label className={labelClass}>Transcript</label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={5}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>
        </Card>

        {status === "error" && (
          <p className="text-[13px] text-center text-[#a32d2d]">
            {errorDetail}
          </p>
        )}

        <div className="flex justify-center">
          <PillButton type="submit">
            {status === "saving" ? "Creating…" : "Create client"}
          </PillButton>
        </div>
      </form>
    </main>
  );
}
