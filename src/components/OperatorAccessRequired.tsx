export function OperatorAccessRequired() {
  return (
    <div className="rounded-[var(--radius)] border border-line p-10 text-center">
      <h2 className="font-display text-lg font-semibold text-ink">Operator access required</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
        Your account isn't on the operator list. Ask an admin to add your email to the whitelist.
      </p>
    </div>
  )
}
