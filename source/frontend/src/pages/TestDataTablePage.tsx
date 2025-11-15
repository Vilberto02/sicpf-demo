import { DataTableExample } from "../components/table/DataTableExample";

export function TestDataTablePage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Demo de datatables
        </h1>
        <DataTableExample />
      </div>
    </div>
  );
}