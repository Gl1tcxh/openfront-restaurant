import { ListPage } from "@/features/dashboard/screens/ListPage";

export default async function Page(props: any) {
  const searchParams = await props.searchParams;
  return (
    <ListPage 
      params={Promise.resolve({ listKey: "users" })} 
      searchParams={Promise.resolve(searchParams)} 
    />
  );
}
