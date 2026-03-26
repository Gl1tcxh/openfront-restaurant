import { ListPage } from '@/features/dashboard/screens/ListPage'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export function MenuCategoryListPage({ searchParams }: PageProps) {
  return <ListPage listKey="menu-categories" searchParams={searchParams} />
}

export default MenuCategoryListPage
