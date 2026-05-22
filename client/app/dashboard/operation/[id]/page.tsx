import MachineDetailClient from "./MachineDetailClient"

export function generateStaticParams() {
  return [
    { id: "PST-001" },
    { id: "FLL-002" },
    { id: "CNV-001" },
    { id: "CLD-003" },
    { id: "BLR-001" },
    { id: "placeholder" }
  ]
}

export default function Page() {
  return <MachineDetailClient />
}
