import React, { useEffect, useMemo, useState } from "react";
import logo from "../logo.png";

const STORAGE_KEY = "agenda-ars-final";

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("it-IT");
}

function whatsappLink(contact, appointment) {
  const phone = (contact?.phone || "").replace(/\D/g, "");
  const text = encodeURIComponent(
    `Ciao ${contact?.firstName}, ti ricordo l'appuntamento "${appointment.title}" del ${formatDateTime(appointment.datetime)}`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

function mapsLink(location) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function mapsNav(location) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;
}

function WhatsappIcon() {
  return (
    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width={22}/>
  );
}

function MapsIcon() {
  return (
    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d1/Google_Maps_icon_%282020%29.svg" width={20}/>
  );
}

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [contactForm, setContactForm] = useState({});
  const [appointmentForm, setAppointmentForm] = useState({});

  const [editContactId, setEditContactId] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setContacts(data.contacts || []);
      setAppointments(data.appointments || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ contacts, appointments })
    );
  }, [contacts, appointments]);

  function saveContact(e) {
    e.preventDefault();

    if (editContactId) {
      setContacts(
        contacts.map(c =>
          c.id === editContactId ? { ...c, ...contactForm } : c
        )
      );
      setEditContactId(null);
    } else {
      setContacts([{ id: crypto.randomUUID(), ...contactForm }, ...contacts]);
    }

    setContactForm({});
  }

  function editContact(c) {
    setContactForm(c);
    setEditContactId(c.id);
  }

  function saveAppointment(e) {
    e.preventDefault();
    setAppointments([{ id: crypto.randomUUID(), ...appointmentForm }, ...appointments]);
    setAppointmentForm({});
  }

  return (
    <div style={styles.page}>
      <img src={logo} style={styles.logo}/>

      <div style={styles.container}>
        <h1 style={styles.title}>Agenda A.R.S. Srl</h1>

        <div style={styles.grid}>
          <div style={styles.panel}>
            <h2>Contatto</h2>
            <form onSubmit={saveContact}>
              <input style={styles.input} placeholder="Nome"
                value={contactForm.firstName || ""}
                onChange={e=>setContactForm({...contactForm, firstName:e.target.value})}/>
              <input style={styles.input} placeholder="Cognome"
                value={contactForm.lastName || ""}
                onChange={e=>setContactForm({...contactForm, lastName:e.target.value})}/>
              <input style={styles.input} placeholder="Telefono"
                value={contactForm.phone || ""}
                onChange={e=>setContactForm({...contactForm, phone:e.target.value})}/>
              <button style={styles.button}>Salva</button>
            </form>
          </div>

          <div style={styles.panel}>
            <h2>Appuntamento</h2>
            <form onSubmit={saveAppointment}>
              <input style={styles.input} placeholder="Titolo"
                onChange={e=>setAppointmentForm({...appointmentForm, title:e.target.value})}/>
              <select style={styles.input}
                onChange={e=>setAppointmentForm({...appointmentForm, contactId:e.target.value})}>
                <option>Contatto</option>
                {contacts.map(c=>(
                  <option key={c.id} value={c.id}>
                    {c.firstName}
                  </option>
                ))}
              </select>
              <input type="datetime-local" style={styles.input}
                onChange={e=>setAppointmentForm({...appointmentForm, datetime:e.target.value})}/>
              <input style={styles.input} placeholder="Indirizzo"
                onChange={e=>setAppointmentForm({...appointmentForm, location:e.target.value})}/>
              <button style={styles.button}>Salva</button>
            </form>
          </div>
        </div>

        <div style={styles.grid}>
          <div style={styles.panel}>
            <h2>Contatti</h2>
            {contacts.map(c=>(
              <div key={c.id} style={styles.card}>
                <b>{c.firstName} {c.lastName}</b><br/>
                {c.phone}
                <div>
                  <button style={styles.editBtn} onClick={()=>editContact(c)}>Modifica</button>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.panel}>
            <h2>Appuntamenti</h2>
            {appointments.map(a=>{
              const contact = contacts.find(c=>c.id===a.contactId);
              return (
                <div key={a.id} style={styles.card}>
                  <b>{a.title}</b><br/>
                  {formatDateTime(a.datetime)}<br/>
                  {contact?.firstName}<br/>

                  {a.location && (
                    <>
                      <a href={mapsLink(a.location)} target="_blank" style={styles.link}>
                        <MapsIcon/> {a.location}
                      </a><br/>
                      <a href={mapsNav(a.location)} target="_blank" style={styles.nav}>
                        Naviga
                      </a>
                    </>
                  )}

                  <div style={styles.actions}>
                    <a href={whatsappLink(contact,a)} target="_blank" style={styles.iconBtn}>
                      <WhatsappIcon/>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#1e3a5f",
    padding: 20,
    color: "white",
    fontFamily: "Arial"
  },

  logo: {
    position: "absolute",
    top: 20,
    right: 20,
    height: 40
  },

  container: { maxWidth: 1100, margin: "auto" },

  title: { fontSize: 32 },

  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },

  panel: {
    background: "#2c5282",
    padding: 20,
    borderRadius: 15
  },

  input: {
    width: "100%",
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    border: "none"
  },

  button: {
    width: "100%",
    padding: 12,
    background: "#63b3ed",
    border: "none",
    borderRadius: 10
  },

  card: {
    background: "#1a365d",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10
  },

  actions: { marginTop: 10 },

  iconBtn: {
    display: "inline-block",
    background: "white",
    padding: 6,
    borderRadius: 8
  },

  link: {
    color: "#90cdf4",
    textDecoration: "none"
  },

  nav: {
    display: "inline-block",
    marginTop: 5,
    background: "#63b3ed",
    padding: "5px 10px",
    borderRadius: 6,
    color: "white",
    textDecoration: "none"
  },

  editBtn: {
    marginTop: 5,
    background: "#ecc94b",
    border: "none",
    padding: 5,
    borderRadius: 6
  }
};
