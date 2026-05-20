export function CSVTable({ contacts, selectedContactId, onSelectContact }) {
  return (
    <section className="panel panel-wide">
      <div className="panel-header">
        <h2>Prospect List</h2>
        <span>{contacts.length} contacts</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Area</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr
                key={contact.id}
                className={contact.id === selectedContactId ? 'selected-row' : ''}
                onClick={() => onSelectContact(contact.id)}
              >
                <td>{contact.name}</td>
                <td>{contact.area || 'N/A'}</td>
                <td>{contact.email || 'Missing'}</td>
                <td>{contact.phone || 'Missing'}</td>
                <td>{contact.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
