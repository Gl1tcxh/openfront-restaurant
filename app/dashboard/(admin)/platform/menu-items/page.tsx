import { ListPage } from "@/features/dashboard/screens/ListPage";

export default async function Page(props: any) {
  const searchParams = await props.searchParams;
  return (
    <ListPage 
      params={Promise.resolve({ listKey: "menu-items" })} 
      searchParams={Promise.resolve(searchParams)} 
    />
  );
}
