import { useCallback, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { useApiData } from "@/hooks/useApiData";
import { formatDate, initialsOf } from "@/lib/format";
import { listCustomers } from "@/services/admin.service";
import type { CustomerSummary } from "@/types/api";

/**
 * Customer directory.
 *
 * GET /Admin/customers returns one summary row per customer, so the whole
 * directory is a single request and search runs client-side — appropriate for a
 * list this size and avoids a per-keystroke round trip.
 *
 * The summary DTO carries only booking totals, not per-status breakdowns or
 * spend, so the columns are limited to what the API actually returns rather than
 * padded with zeros.
 *
 * Note: the backend also exposes /Customer/allCustomer anonymously; this screen
 * deliberately uses the authenticated admin route.
 */
export function AdminCustomersPage() {
  const [query, setQuery] = useState("");

  const loader = useCallback(() => listCustomers(), []);
  const { data, isLoading, error, refetch } = useApiData<CustomerSummary[]>(loader, []);

  const customers = useMemo(() => {
    const all = data ?? [];
    const term = query.trim().toLowerCase();
    if (!term) return all;
    return all.filter((customer) =>
      [customer.Name, customer.Email, customer.Phone, customer.Address]
        .filter((field): field is string => Boolean(field))
        .some((field) => field.toLowerCase().includes(term)),
    );
  }, [data, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          Customers
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everyone with a customer account, with their contact details and booking totals.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, phone or address"
          className="pl-9"
          aria-label="Search customers"
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : customers.length === 0 ? (
        <EmptyState
          title={query ? "No matching customers" : "No customers yet"}
          description={
            query
              ? "Try a different search term."
              : "Customer accounts appear here once someone signs up or books a service."
          }
          icon={<Users className="size-6" />}
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.Id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="text-xs">
                            {initialsOf(customer.Name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{customer.Name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {customer.Email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-600">
                      {customer.Phone || "—"}
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate text-slate-600">
                      {customer.Address || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {customer.TotalBookings}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-600">
                      {formatDate(customer.JoinedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            {customers.length} of {data?.length ?? 0} customers
          </p>
        </>
      )}
    </div>
  );
}