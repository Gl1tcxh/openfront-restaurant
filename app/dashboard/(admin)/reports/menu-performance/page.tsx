export const dynamic = 'force-dynamic';

import { MenuPerformanceReport } from "@/features/platform/reports/screens/MenuPerformanceReport";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return <MenuPerformanceReport searchParams={searchParams} />;
}
