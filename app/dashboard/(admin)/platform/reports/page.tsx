import Link from 'next/link'

export default function Page() {
  return (
    <div className="flex flex-col gap-3 p-6">
      <h1 className="text-lg font-semibold">Reports</h1>
      <div className="flex flex-col gap-2">
        <Link className="text-blue-600 hover:underline" href="/dashboard/platform/reports/sales">
          Sales Report
        </Link>
        <Link className="text-blue-600 hover:underline" href="/dashboard/platform/reports/menu-performance">
          Menu Performance
        </Link>
      </div>
    </div>
  )
}
