/**
 * Defines the base URL for the API.
 * The default values is overridden by the `API_BASE_URL` environment variable.
 */
import { default as formatReservationDate, default as formatReservationTime } from "./format-reservation-date";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

/**
 * Defines the default headers for these functions to work with `json-server`
 */
const headers = new Headers();
headers.append("Content-Type", "application/json");

/**
 * Fetch `json` from the specified URL and handle error status codes and ignore `AbortError`s
 *
 * This function is NOT exported because it is not needed outside of this file.
 *
 * @param url
 *  the url for the requst.
 * @param options
 *  any options for fetch
 * @param onCancel
 *  value to return if fetch call is aborted. Default value is undefined.
 * @returns {Promise<Error|any>}
 *  a promise that resolves to the `json` data or an error.
 *  If the response is not in the 200 - 399 range the promise is rejected.
 */
async function fetchJson(url, options, onCancel) {
  try {
    const response = await fetch(url, { credentials: "include", ...options });

    if (response.status === 204) {
      return null;
    }

    const payload = await response.json();

    if (payload.error) {
      return Promise.reject({ message: payload.error });
    }
    return payload.data;
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error(error.stack);
      throw error;
    }
    return Promise.resolve(onCancel);
  }
}

/**
 * Retrieves all existing reservation.
 * @returns {Promise<[reservation]>}
 *  a promise that resolves to a possibly empty array of reservation saved in the database.
 */

export async function login(email, password, signal) {
  const url = `${API_BASE_URL}/auth/login`;
  const options = {
    method: "POST",
    headers,
    body: JSON.stringify({ data: { email, password } }),
    signal,
  };
  return await fetchJson(url, options);
}

export async function logout(signal) {
  const url = `${API_BASE_URL}/auth/logout`;
  return await fetchJson(url, { method: "POST", headers, signal });
}

export async function getCurrentUser(signal) {
  const url = `${API_BASE_URL}/auth/me`;
  return await fetchJson(url, { headers, signal });
}

export async function getSettings(signal) {
  const url = `${API_BASE_URL}/settings`;
  return await fetchJson(url, { headers, signal });
}

export async function updateSettings(settings, signal) {
  const url = `${API_BASE_URL}/settings`;
  const options = {
    method: "PUT",
    headers,
    body: JSON.stringify({ data: settings }),
    signal,
  };
  return await fetchJson(url, options);
}

export async function listGuests(mobile_number, signal) {
  const url = new URL(`${API_BASE_URL}/guests`);
  if (mobile_number) url.searchParams.append("mobile_number", mobile_number);
  return await fetchJson(url, { headers, signal }, []);
}

export async function readGuest(guest_id, signal) {
  const url = `${API_BASE_URL}/guests/${guest_id}`;
  return await fetchJson(url, { headers, signal });
}

export async function updateGuest(guest, signal) {
  const url = `${API_BASE_URL}/guests/${guest.guest_id}`;
  const options = {
    method: "PUT",
    headers,
    body: JSON.stringify({ data: guest }),
    signal,
  };
  return await fetchJson(url, options);
}

export async function listNotifications(params, signal) {
  const url = new URL(`${API_BASE_URL}/notifications`);
  Object.entries(params || {}).forEach(([key, value]) =>
    url.searchParams.append(key, value.toString())
  );
  return await fetchJson(url, { headers, signal }, []);
}

export async function getPublicRestaurant(signal) {
  const url = `${API_BASE_URL}/public/restaurant`;
  return await fetchJson(url, { headers, signal });
}

export async function listAvailability(date, people, signal) {
  const url = new URL(`${API_BASE_URL}/public/availability`);
  url.searchParams.append("date", date);
  url.searchParams.append("people", people);
  return await fetchJson(url, { headers, signal }, []);
}

export async function createPublicReservation(reservation, signal) {
  const url = `${API_BASE_URL}/public/reservations`;
  const options = {
    method: "POST",
    headers,
    body: JSON.stringify({ data: reservation }),
    signal,
  };
  return await fetchJson(url, options);
}

export async function readPublicReservation(
  reservation_id,
  mobile_number,
  signal
) {
  const url = new URL(`${API_BASE_URL}/public/reservations/${reservation_id}`);
  url.searchParams.append("mobile_number", mobile_number);
  return await fetchJson(url, { headers, signal });
}

export async function cancelPublicReservation(
  reservation_id,
  mobile_number,
  signal
) {
  const url = `${API_BASE_URL}/public/reservations/${reservation_id}/cancel`;
  const options = {
    method: "PUT",
    headers,
    body: JSON.stringify({ data: { mobile_number } }),
    signal,
  };
  return await fetchJson(url, options);
}

export async function listMenuItems(includeInactive, signal) {
  const url = new URL(`${API_BASE_URL}/menu-items`);
  if (includeInactive) url.searchParams.append("all", "true");
  return await fetchJson(url, { headers, signal }, []);
}

export async function createMenuItem(menuItem, signal) {
  const url = `${API_BASE_URL}/menu-items`;
  const options = {
    method: "POST",
    headers,
    body: JSON.stringify({ data: menuItem }),
    signal,
  };
  return await fetchJson(url, options);
}

export async function updateMenuItem(menuItem, signal) {
  const url = `${API_BASE_URL}/menu-items/${menuItem.menu_item_id}`;
  const options = {
    method: "PUT",
    headers,
    body: JSON.stringify({ data: menuItem }),
    signal,
  };
  return await fetchJson(url, options);
}

export async function readCheck(check_id, signal) {
  const url = `${API_BASE_URL}/checks/${check_id}`;
  return await fetchJson(url, { headers, signal });
}

export async function addCheckItem(check_id, menu_item_id, quantity, signal) {
  const url = `${API_BASE_URL}/checks/${check_id}/items`;
  const options = {
    method: "POST",
    headers,
    body: JSON.stringify({ data: { menu_item_id, quantity } }),
    signal,
  };
  return await fetchJson(url, options);
}

export async function removeCheckItem(check_id, check_item_id, signal) {
  const url = `${API_BASE_URL}/checks/${check_id}/items/${check_item_id}`;
  return await fetchJson(url, { method: "DELETE", headers, signal });
}

export async function closeCheck(check_id, signal) {
  const url = `${API_BASE_URL}/checks/${check_id}/close`;
  return await fetchJson(url, { method: "PUT", headers, signal });
}

export async function getDailyReport(date, signal) {
  const url = new URL(`${API_BASE_URL}/reports/daily`);
  url.searchParams.append("date", date);
  return await fetchJson(url, { headers, signal });
}

export async function pingBackend() {
  const url = `${API_BASE_URL}/system/ping`; // Replace '/ping' with an appropriate endpoint
  return await fetchJson(url, { method: 'GET' });
}

export async function listReservations(params, signal) {
  const url = new URL(`${API_BASE_URL}/reservations`);
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.append(key, value.toString())
  );
  return await fetchJson(url, { headers, signal }, [])
    .then(data => { console.log(data); return formatReservationDate(data); })
    .then(data => { console.log(data); return formatReservationTime(data); });
}

export async function createReservation(reservation, signal) {
  const url = new URL(`${API_BASE_URL}/reservations`);
  const options = {
    method: "POST",
    mode: "cors",
    headers,
    body: JSON.stringify({ data: reservation }),
    signal,
  };
  return await fetchJson(url, options, reservation);
}

export async function readReservation(reservation_id, signal) {
  const url = new URL(`${API_BASE_URL}/reservations/${reservation_id}`);
  const options = {
    method: "GET",
    mode: "cors",
    headers,
    signal,
  };
  return await fetchJson(url, options, reservation_id)
    .then(formatReservationDate)
    .then(formatReservationTime)
}

export async function listTables(params, signal) {
  const url = new URL(`${API_BASE_URL}/tables`);
  return await fetchJson(url, { headers, signal }, []);
}

export async function createTable(table, signal) {
  const url = new URL(`${API_BASE_URL}/tables`);
  const options = {
    method: "POST",
    mode: "cors",
    headers,
    body: JSON.stringify({ data: table }),
    signal,
  };

  return await fetchJson(url, options, table);
}

export async function seatReservation(reservation_id, table_id, signal) {
  const url = `${API_BASE_URL}/tables/${table_id}/seat`;
  const options = {
    method: "PUT",
    mode: "cors",
    headers,
    body: JSON.stringify({ data: { reservation_id } }),
    signal,
  };
  return await fetchJson(url, options, {});
}

export async function finishTable(table_id) {
  const url = `${API_BASE_URL}/tables/${table_id}/seat`;
  const options = {
    method: "DELETE",
    headers,
  };
  return await fetchJson(url, options, {});
}

export async function updateReservation(reservation, signal) {
  const { reservation_date, reservation_time, reservation_id } = reservation;
  const url = `${API_BASE_URL}/reservations/${reservation_id}`;

  const data = {
    ...reservation,
    reservation_date,
    reservation_time,
  };

  const options = {
    method: "PUT",
    mode: "cors",
    body: JSON.stringify({ data }),
    headers,
    signal,
  };
  const response = await fetchJson(url, options, reservation);

  return Array.isArray(response) ? response[0] : response;
}

export async function cancelReservation(reservation_id, signal) {
  const url = `${API_BASE_URL}/reservations/${reservation_id}/status`;
  const options = {
    method: "PUT",
    mode: "cors",
    headers,
    body: JSON.stringify({
      data: { status: "cancelled" },
    }),
    signal,
  };
  return await fetchJson(url, options, {});
}