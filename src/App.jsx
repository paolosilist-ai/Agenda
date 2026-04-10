import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "agenda-commerciale-v1";

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function initialData() {
  return {
    contacts: [
      {
        id: crypto.randomUUID(),
        firstName: "Mario",
        lastName: "Rossi",
        company: "Rossi Impianti",
        phone: "+393331112233",
        email: "mario.rossi@email.it",
        notes: "Cliente interessato a ricevere un'offerta entro fine mese.",
      },
    ],
    appointments: [],
  };
}

export default function App() {
  const [data, setData] = useState(() => {
    const seed = initialData();
    const firstContactId = seed.contacts[0].id;
    seed.appointments = [
      {
        id: crypto.randomUUID(),
        title: "Incontro conoscitivo",
        contactId: firstContactId,
        datetime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        location: "Milano",
        notes: "Portare presentazione commerciale.",
        status: "programmato",
      },
    ];

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return seed;
    try {
      return JSON.parse(saved);
    } catch {
      return seed;
    }
  });

  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
    email: "",
    notes: "",
  });

  const [appointmentForm, setAppointmentForm] = useState({
    title: "",
    contactId: "",
    datetime: "",
    location: "",
    notes: "",
    status: "programmato",
  });

  const [contactSearch, setContactSearch] = useState("");
  const [appointmentSearch, setAppointmentSearch] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const contacts = data.contacts || [];
  const appointments = data.appointments || [];

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.firstName, c.lastName, c.company, c.phone, c.email, c.notes]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [contacts, contactSearch]);

  const filteredAppointments = useMemo(() => {
    const q = appointmentSearch.trim().toLowerCase();
    const enriched = appointments
      .map((a) => ({
        ...a,
        contact: contacts.find((c) => c.id === a.contactId),
      }))
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

    if (!q) return enriched;
    return enriched.filter((a) =>
      [a.title, a.location, a.notes, a.status, a.contact?.firstName, a.contact?.lastName, a.contact?.company]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [appointments, contacts, appointmentSearch]);

  function addContact(e) {
    e.preventDefault();
    if (!contactForm.firstName || !contactForm.lastName) return;
    const newContact = { id: crypto.randomUUID(), ...contactForm };
    setData((prev) => ({ ...prev, contacts: [newContact, ...prev.contacts] }));
    setContactForm({
      firstName: "",
      lastName: "",
      company: "",
      phone: "",
      email: "",
      notes: "",
    });
  }

  function addAppointment(e) {
    e.preventDefault();
    if (!appointmentForm.title || !appointmentForm.contactId || !appointmentForm.datetime) return;
    const newAppointment = { id: crypto.randomUUID(), ...appointmentForm };
    setData((prev) => ({ ...prev, appointments: [newAppointment, ...prev.appointments] }));
    setAppointmentForm({
      title: "",
      contactId: "",
      datetime: "",
      location: "",
      notes: "",
      status: "programmato",
    });
  }

  function deleteContact(id) {
    setData((prev) => ({
      contacts: prev.contacts.filter((c) => c.id !== id),
      appointments: prev.appointments.filter((a) => a.contactId !== id),
    }));
  }

  function deleteAppointment(id) {
    setData((prev) => ({
      ...prev,
      appointments: prev.appointments.filter((a) => a.id !== id),
    }));
  }

  function whatsappLink(contact, appointment) {
    const phone = (contact?.phone || "").replace(/\D/g, "");
    const text = encodeURIComponent(
      `Ciao ${contact?.firstName || ""}, ti ricordo il nostro appuntamento${
        appointment?.title ? ` per ${appointment.title}` : ""
      } del ${formatDateTime(appointment?.datetime)}${
        appointment?.location ? ` presso ${appointment.location}` : ""
      }. A presto.`
    );
    return `https://wa.me/${phone}?text=${text}`;
  }

  function mailtoLink(contact, appointment) {
    const subject = encodeURIComponent(`Promemoria appuntamento - ${appointment?.title || "Incontro"}`);
    const body = encodeURIComponent(
      `Buongiorno ${contact?.firstName || ""} ${contact?.lastName || ""},\n\n` +
        `ti ricordo il nostro appuntamento${appointment?.title ? ` per "${appointment.title}"` : ""} ` +
        `fissato per ${formatDateTime(appointment?.datetime)}${
          appointment?.location ? ` presso ${appointment.location}` : ""
        }.\n\nCordiali saluti.`
    );
    return `mailto:${contact?.email || ""}?subject=${subject}&body=${body}`;
  }

  const nextAppointments = filteredAppointments
    .filter((a) => new Date(a.datetime) >= new Date())
    .slice(0, 5);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 6 }}>Agenda commerciale</h1>
        <p style={{ color: "#475569", marginTop: 0 }}>
          Gestisci contatti, appuntamenti e reminder WhatsApp o email.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, margin: "20px 0" }}>
          <div style={cardStyle}><strong>Contatti</strong><div style={bigNumber}>{contacts.length}</div></div>
          <div style={cardStyle}><strong>Appuntamenti</strong><div style={bigNumber}>{appointments.length}</div></div>
          <div style={cardStyle}><strong>Prossimi</strong><div style={bigNumber}>{nextAppointments.length}</div></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <div style={panelStyle}>
            <h2>Nuovo contatto</h2>
            <form onSubmit={addContact}>
              <input style={inputStyle} placeholder="Nome" value={contactForm.firstName} onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })} />
              <input style={inputStyle} placeholder="Cognome" value={contactForm.lastName} onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })} />
              <input style={inputStyle} placeholder="Azienda" value={contactForm.company} onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })} />
              <input style={inputStyle} placeholder="Telefono" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
              <input style={inputStyle} placeholder="Email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
              <textarea style={textareaStyle} placeholder="Note" value={contactForm.notes} onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })} />
              <button style={buttonStyle} type="submit">Salva contatto</button>
            </form>
          </div>

          <div style={panelStyle}>
            <h2>Nuovo appuntamento</h2>
            <form onSubmit={addAppointment}>
              <input style={inputStyle} placeholder="Titolo appuntamento" value={appointmentForm.title} onChange={(e) => setAppointmentForm({ ...appointmentForm, title: e.target.value })} />
              <select style={inputStyle} value={appointmentForm.contactId} onChange={(e) => setAppointmentForm({ ...appointmentForm, contactId: e.target.value })}>
                <option value="">Seleziona contatto</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.company ? ` - ${c.company}` : ""}</option>
                ))}
              </select>
              <input style={inputStyle} type="datetime-local" value={appointmentForm.datetime} onChange={(e) => setAppointmentForm({ ...appointmentForm, datetime: e.target.value })} />
              <input style={inputStyle} placeholder="Luogo" value={appointmentForm.location} onChange={(e) => setAppointmentForm({ ...appointmentForm, location: e.target.value })} />
              <select style={inputStyle} value={appointmentForm.status} onChange={(e) => setAppointmentForm({ ...appointmentForm, status: e.target.value })}>
                <option value="programmato">Programmato</option>
                <option value="confermato">Confermato</option>
                <option value="svolto">Svolto</option>
                <option value="rinviato">Rinviato</option>
              </select>
              <textarea style={textareaStyle} placeholder="Note" value={appointmentForm.notes} onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })} />
              <button style={buttonStyle} type="submit">Salva appuntamento</button>
            </form>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 24 }}>
          <div style={panelStyle}>
            <h2>Contatti</h2>
            <input style={inputStyle} placeholder="Cerca contatto..." value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} />
            <div style={{ display: "grid", gap: 12 }}>
              {filteredContacts.map((c) => (
                <div key={c.id} style={itemStyle}>
                  <div>
                    <strong>{c.firstName} {c.lastName}</strong>
                    {c.company ? <div style={mutedStyle}>{c.company}</div> : null}
                    {c.phone ? <div style={smallStyle}>📞 {c.phone}</div> : null}
                    {c.email ? <div style={smallStyle}>✉️ {c.email}</div> : null}
                    {c.notes ? <div style={smallStyle}>{c.notes}</div> : null}
                  </div>
                  <button style={dangerButtonStyle} onClick={() => deleteContact(c.id)}>Elimina</button>
                </div>
              ))}
            </div>
          </div>

          <div style={panelStyle}>
            <h2>Appuntamenti</h2>
            <input style={inputStyle} placeholder="Cerca appuntamento..." value={appointmentSearch} onChange={(e) => setAppointmentSearch(e.target.value)} />
            <div style={{ display: "grid", gap: 12 }}>
              {filteredAppointments.map((a) => {
                const contact = contacts.find((c) => c.id === a.contactId);
                return (
                  <div key={a.id} style={itemStyle}>
                    <div>
                      <strong>{a.title}</strong>
                      <div style={mutedStyle}>{formatDateTime(a.datetime)}</div>
                      {contact ? <div style={smallStyle}>👤 {contact.firstName} {contact.lastName}{contact.company ? ` - ${contact.company}` : ""}</div> : null}
                      {a.location ? <div style={smallStyle}>📍 {a.location}</div> : null}
                      {a.notes ? <div style={smallStyle}>{a.notes}</div> : null}
                      <div style={smallStyle}>Stato: {a.status}</div>
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {contact?.phone ? (
                        <a style={linkButtonStyle} href={whatsappLink(contact, a)} target="_blank" rel="noreferrer">WhatsApp</a>
                      ) : null}
                      {contact?.email ? (
                        <a style={linkButtonStyle} href={mailtoLink(contact, a)}>Email</a>
                      ) : null}
                      <button style={dangerButtonStyle} onClick={() => deleteAppointment(a.id)}>Elimina</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#ffffff",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

const panelStyle = {
  background: "#ffffff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

const itemStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  marginBottom: 10,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 14,
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 90,
  resize: "vertical",
};

const buttonStyle = {
  background: "#111827",
  color: "#ffffff",
  border: "none",
  borderRadius: 10,
  padding: "12px 14px",
  cursor: "pointer",
  width: "100%",
};

const dangerButtonStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "none",
  borderRadius: 10,
  padding: "10px 12px",
  cursor: "pointer",
};

const linkButtonStyle = {
  background: "#e2e8f0",
  color: "#111827",
  textDecoration: "none",
  borderRadius: 10,
  padding: "10px 12px",
  textAlign: "center",
};

const bigNumber = {
  fontSize: 32,
  fontWeight: 700,
  marginTop: 8,
};

const mutedStyle = {
  color: "#475569",
  marginTop: 4,
};

const smallStyle = {
  color: "#334155",
  marginTop: 4,
  fontSize: 14,
};