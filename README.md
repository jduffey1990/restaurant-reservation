
# **Restaurant Reservation App**
### Restaurant Reservation is made for a ficticious restaurant named "Periodic Tables" to manage their tables and reservations.
### Render spins down the back end after 15 minutes of the app not being used for these freee instances.  If you use the search function it should jog the back end and spin up after a brief period.
![Screenshot 2023-10-17 093955](https://github.com/jduffey1990/restaurant-reservation/assets/122471477/bd80f67b-34d1-49a6-8ea8-8a6b3e300557)


## **Links**
- [Deployed Site](https://restaurant-reservation-front-ix6h.onrender.com)
- [Server directory](https://github.com/jduffey1990/restaurant-reservation/tree/main/back-end)
- [Front-end directory](https://github.com/jduffey1990/restaurant-reservation/tree/main/front-end)

## **Functionality and Lifecycle**
### Reservations:
- Create
- Edit
- Seat
- Cancel
- Search
### Tables:
- Create


## **Screenshots**
### **Reservations:**
This Dashboard page is the home page for the restaurant.  The Host or manager can see reservations booked for today, yesterday and tomorrow.  This includes the status of the reservation, and if the reservation is booked, they have the opportunity to seat them at a table, edit the reservation, or cancel it.

We also have functionality showing all of the tables.  This does not change by date because the tables are static.  However the status does change from free to occupied, and the manager can finish the table once the party has finished their meal.
![Screenshot 2023-07-21 101953](https://github.com/jduffey1990/restaurant-reservation/assets/122471477/ad3290a3-2807-47cb-bed6-6c44a39a1c20)


#### **Create Reservation:**
![Screenshot 2023-07-21 102105](https://github.com/jduffey1990/restaurant-reservation/assets/122471477/00e76da4-2aa9-477d-85cc-d78587e6f952)


#### **Edit Reservation:**
![Screenshot 2023-07-21 103153](https://github.com/jduffey1990/restaurant-reservation/assets/122471477/aeb7b2c4-5266-43a3-9c65-a53ba3184924)



#### **Seat Reservation:**
When a party is ready to sit at a table, then host can select the table, and the party status will change to seated, and the table will change to occupied.  Patrons cannot be seated at a table if the capacity is too large for the table to handle, or if the table is already occupied.
![Screenshot 2023-07-21 102208](https://github.com/jduffey1990/restaurant-reservation/assets/122471477/17ddf092-a55f-4069-9bd5-9f7129ea2c7a)


#### **Create Table:**
As a growing restaurant, I wanted to give functionality to the manager to add tables if they aquire more space, or if they need to seat a larger party (max 10 due to the two tables holding 6 and 4)
![Screenshot 2023-07-21 102022](https://github.com/jduffey1990/restaurant-reservation/assets/122471477/0ac0694f-07ae-4bb4-8ea0-20c71da319cf)

### **Search For Reservation**
![Search for Reservation](https://github.com/jduffey1990/restaurant-reservation/assets/122471477/c010db5c-215a-48ce-9542-5c367be37926)

## **Technology**
### **Built with:**
- JavaScript
- CORS
- React.js
- Knex
- Node.js
- PostgreSQL
