export const dynamic = 'force-dynamic';

import { SalesReportPage } from "@/features/platform/reports/screens/SalesReportPage";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return <SalesReportPage searchParams={searchParams} />;
}
