import React, { useEffect, useState } from "react";
import ErrorAlert from "../layout/ErrorAlert";
import { listNotifications } from "../utils/api";

const EVENT_LABELS = {
  booking_confirmed: { label: "Confirmation", badge: "badge-success" },
  booking_cancelled: { label: "Cancellation", badge: "badge-danger" },
};

/**
 * Simulated SMS outbox — every message the system "sent" to guests.
 * (No real messages leave the app; this is the demo stand-in for Twilio.)
 */
function NotificationsList() {
  const [notifications, setNotifications] = useState([]);
  const [eventType, setEventType] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const abortController = new AbortController();
    const params = eventType ? { event_type: eventType } : {};
    listNotifications(params, abortController.signal)
      .then(setNotifications)
      .catch(setError);
    return () => abortController.abort();
  }, [eventType]);

  return (
    <main className="container">
      <h1>Notifications</h1>
      <p className="text-muted">
        Simulated SMS outbox — in production these would be delivered by a
        messaging provider.
      </p>
      <ErrorAlert error={error} />
      <div className="form-group col-md-4 pl-0">
        <select
          className="form-control"
          aria-label="Filter by type"
          value={eventType}
          onChange={({ target }) => setEventType(target.value)}
        >
          <option value="">All messages</option>
          <option value="booking_confirmed">Confirmations</option>
          <option value="booking_cancelled">Cancellations</option>
        </select>
      </div>
      {notifications.length ? (
        <div className="table-responsive table-cards">
          <table className="table">
            <thead>
              <tr>
                <th>Sent</th>
                <th>Type</th>
                <th>To</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => {
                const meta = EVENT_LABELS[notification.event_type] || {
                  label: notification.event_type,
                  badge: "badge-secondary",
                };
                return (
                  <tr key={notification.notification_id}>
                    <td data-label="Sent" className="text-nowrap cell-title">
                      {new Date(notification.sent_at).toLocaleString()}
                    </td>
                    <td data-label="Type">
                      <span className={`badge ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td data-label="To" className="text-nowrap">
                      {notification.recipient}
                    </td>
                    <td data-label="Message" className="cell-block">
                      {notification.body}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No messages sent yet.</p>
      )}
    </main>
  );
}

export default NotificationsList;
