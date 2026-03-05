export default function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-500">{label}</p>
      <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-900">
        {value}
      </div>
    </div>
  )
}
