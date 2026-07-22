import { Badge } from "@/components/ui/badge";
import type { Account } from "@prisma/client";

export function ConnectedAccounts({
    accounts,
}: {
    accounts: Account[];
}) {
    if (accounts.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No connected accounts yet.
            </p>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {accounts.map((account) => (
                <Badge
                    key={account.id}
                    variant="outline"
                    className="capitalize"
                >
                    {account.provider}
                </Badge>
            ))}
        </div>
    );
}
