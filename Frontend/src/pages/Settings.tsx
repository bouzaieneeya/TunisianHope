import { Panel } from "@/components/shared/Panel";
import { useApp } from "@/context/AppContext";
import { users } from "@/lib/mockData";
import { toast } from "sonner";

export default function Settings() {
  const { currentUser } = useApp();
  return (
    <div className="space-y-4 max-w-3xl">
      <Panel title="Account">
        <dl className="text-sm space-y-2">
          <div className="flex justify-between"><dt className="text-muted-foreground">Name</dt><dd>{currentUser.name}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Username</dt><dd>{currentUser.username}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Role</dt><dd>{currentUser.role}</dd></div>
        </dl>
      </Panel>

      <Panel title="Team">
        <ul className="divide-y divide-border -mx-1">
          {users.map(u => (
            <li key={u.id} className="px-1 py-2.5 flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{u.initials}</div>
              <div className="flex-1"><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.username}</div></div>
              <span className="text-xs px-2 py-0.5 rounded border border-border">{u.role}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {currentUser.role === "Admin" && (
        <Panel title="Platform policies">
          <div className="space-y-3 text-sm">
            <label className="flex items-center justify-between"><span>Require counselor validation for all awareness actions</span><input type="checkbox" defaultChecked /></label>
            <label className="flex items-center justify-between"><span>Auto-assign counselor on high-risk detection</span><input type="checkbox" defaultChecked /></label>
            <label className="flex items-center justify-between"><span>Anonymize identifiers in exports</span><input type="checkbox" defaultChecked /></label>
            <button onClick={() => toast.success("Policies saved")} className="h-9 px-4 text-sm rounded-md bg-primary text-primary-foreground">Save policies</button>
          </div>
        </Panel>
      )}
    </div>
  );
}
