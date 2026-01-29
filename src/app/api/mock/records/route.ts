import { NextRequest, NextResponse } from "next/server";

import type { RecordItem, RecordStatus } from "@/app/interview/types";

// Sample dataset. Feel free to extend with more realistic examples.
const records: RecordItem[] = [
  {
    id: "1",
    name: "Anopheles gambiae ♀",
    status: "pending",
    description:
      "Collected by CDC light trap near Nyansato village (Ghana), 12 Mar 2026. Indoor resting capture at 05:30. Wing venation suggests An. gambiae s.l.; awaiting PCR confirmation for s.s. vs coluzzii.",
  },
  {
    id: "2",
    name: "Anopheles funestus ♀",
    status: "approved",
    description:
      "Human landing catch (HLC) in Kagera region (Tanzania), 18 Mar 2026, 22:15. Distinctively banded legs and pale wing spots. Verified by senior entomologist.",
    note: "Morphology consistent with An. funestus s.s.; add to indoor-resting dataset.",
  },
  {
    id: "3",
    name: "Anopheles arabiensis ♀",
    status: "flagged",
    description:
      "Pyrethrum spray catch in Mchinji (Malawi), 09 Mar 2026. Specimen abdomen damaged; blood meal analysis inconclusive.",
    note: "Image blurry; request re-photo and consider ELISA for bloodmeal if tissue sufficient.",
  },
  {
    id: "4",
    name: "Anopheles gambiae larva (L3)",
    status: "needs_revision",
    description:
      "Larval dip from irrigated rice field near Kano (Nigeria), 21 Mar 2026. Head capsule and palmate hairs photographed; metadata incomplete.",
    note: "Missing water body type classification and turbidity; please add habitat details.",
  },
  {
    id: "5",
    name: "Anopheles coluzzii ♀",
    status: "approved",
    description:
      "Indoor resting collection, Bobo-Dioulasso (Burkina Faso), 16 Mar 2026. PCR (SINE200) confirms coluzzii. Clear maxillary palps and wing spots.",
    note: "Confirmed coluzzii by molecular assay; include in vector composition analysis.",
  },
  {
    id: "6",
    name: "Anopheles gambiae ♂",
    status: "pending",
    description:
      "Sweep net capture near breeding site in Kisumu (Kenya), 10 Mar 2026. Plumose antennae visible; specimen intact. Awaiting species-level confirmation.",
  },
  {
    id: "7",
    name: "Anopheles rivulorum ♀",
    status: "flagged",
    description:
      "Window exit trap, Nkhata Bay (Malawi), 13 Mar 2026. Possible mislabel: morphology closer to An. funestus group; needs expert review.",
    note: "Suspected mis-ID; cross-check funestus-group keys and reclassify if needed.",
  },
  {
    id: "8",
    name: "Anopheles gambiae egg raft",
    status: "needs_revision",
    description:
      "Collected from temporary puddle, Tamale (Ghana), 08 Mar 2026. Photographs show egg raft but GPS accuracy low (±200m).",
    note: "Update coordinates and add microhabitat photo for verification.",
  },
  {
    id: "9",
    name: "Anopheles pharoensis ♀",
    status: "approved",
    description:
      "Light trap near irrigation canal, Gezira (Sudan), 19 Mar 2026. Diagnostic pale scaling on wings; specimen in good condition.",
  },
  {
    id: "10",
    name: "Anopheles gambiae s.s. ♀",
    status: "approved",
    description:
      "HLC indoor, Savelugu (Ghana), 15 Mar 2026. PCR confirms s.s.; ELISA positive for human blood meal. Eligible for biting time analysis.",
    note: "Add to vector-human contact dataset (indoor, late evening).",
  },
  {
    id: "11",
    name: "Anopheles coustani ♀",
    status: "pending",
    description:
      "Outdoor resting capture, Kilifi (Kenya), 12 Mar 2026. Secondary vector; useful for zoophily assessment. Awaiting supervisor review.",
  },
  {
    id: "12",
    name: "Anopheles funestus ♀ (damaged)",
    status: "flagged",
    description:
      "PSC in Muleba (Tanzania), 20 Mar 2026. Abdomen ruptured; parity determination not possible.",
    note: "Consider excluding from parity analysis; keep for species presence record only.",
  },
];

/*
 * Mock Records API for the interview exercise. This API stores records in
 * memory and supports reading and updating them. Each record has a status
 * and optional note. In-memory persistence means data resets when the
 * server restarts, which is acceptable.
 */

// GET /api/mock/records
export async function GET() {
  return NextResponse.json(records);
}

// PATCH /api/mock/records
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, note } = body as {
      id: string;
      status?: RecordStatus;
      note?: string;
    };
    const record = records.find((r) => r.id === id);
    if (!record) {
      return NextResponse.json(
        { error: `Record with id ${id} not found.` },
        { status: 404 },
      );
    }
    if (status) record.status = status;
    if (note !== undefined) record.note = note;
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
