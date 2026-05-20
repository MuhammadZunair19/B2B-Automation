const statusSteps = ['pending', 'warmup_1', 'warmup_2', 'permission_sent', 'replied', 'opted_out'];

export function SequenceStatus({ contact }) {
  const currentIndex = contact ? statusSteps.indexOf(contact.status) : -1;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Sequence Status</h2>
        <span>{contact ? contact.status : 'No contact selected'}</span>
      </div>

      <div className="timeline">
        {statusSteps.map((step, index) => (
          <div key={step} className={`timeline-step ${index <= currentIndex ? 'is-active' : ''}`}>
            <span>{index + 1}</span>
            <div>
              <strong>{step}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
