export function AnalyticsDash({ contacts }) {
  const metrics = {
    total: contacts.length,
    replied: contacts.filter((contact) => contact.status === 'replied').length,
    inWarmup: contacts.filter((contact) => String(contact.status).startsWith('warmup')).length,
    permissionSent: contacts.filter((contact) => contact.status === 'permission_sent').length
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Analytics</h2>
        <span>Live snapshot</span>
      </div>

      <div className="stats-grid">
        <article>
          <strong>{metrics.total}</strong>
          <span>Total contacts</span>
        </article>
        <article>
          <strong>{metrics.inWarmup}</strong>
          <span>In warmup</span>
        </article>
        <article>
          <strong>{metrics.permissionSent}</strong>
          <span>Permission sent</span>
        </article>
        <article>
          <strong>{metrics.replied}</strong>
          <span>Replies</span>
        </article>
      </div>
    </section>
  );
}
