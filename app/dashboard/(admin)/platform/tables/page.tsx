import { ListPage } from "@/features/dashboard/screens/ListPage";

export default async function Page(props: any) {
  const searchParams = await props.searchParams;
  return (
    <ListPage 
      params={Promise.resolve({ listKey: "tables" })} 
      searchParams={Promise.resolve(searchParams)} 
    />
  );
}
