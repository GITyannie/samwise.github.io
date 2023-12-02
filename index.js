const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser'); 
const app = express();
const port = 3000;

// Database configuration
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'db',
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
    createUsersTable();
    createServicesTable() 
  }
});

// Function to create the 'users' table
function createUsersTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  
    // Execute the query
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table created successfully');
      }
    });
}
// Function to create the 'services' table
function createServicesTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_uuid VARCHAR(36) NOT NULL,
        service_name VARCHAR(50) NOT NULL,
        service_type VARCHAR(50) NOT NULL,
        available_times VARCHAR(255) NOT NULL,
        provider_id INT,
        FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  
    // Execute the query
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error creating services table:', err);
      } else {
        console.log('Services table created successfully');
      }
    });
}


app.use(bodyParser.urlencoded({ extended: true }));


app.post('/register', (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  console.log("password",password)
  console.log("confirmPassword",confirmPassword)
  if (password !== confirmPassword) {
      res.send('Passwords do not match');
      return false; 
  }

  const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(query, [username, email, password], (err, results) => {
    if (err) {
      console.error('Error inserting data into MySQL table:', err);
      res.status(500).send('Internal Server Error');
    } else {
      console.log('Data inserted successfully');
      res.redirect('/service');
    }
  });
});

// Handle login submission
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
  
    // Query the database for the user
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
      if (err) {
        console.error('Error querying the database:', err);
        res.status(500).send('Internal Server Error');
      } else {
        if (results.length > 0) {
            res.redirect(`/service?username=${encodeURIComponent(username)}`);
        } else {
          res.send('Invalid username or password');
        }
      }
    });
  });
  // ...

  app.post('/service/edit', (req, res) => {
    const editServiceName = req.body.editServiceName;
    const editServiceType = req.body.editServiceType;
    const editAvailableTimes = req.body.editAvailableTimes;
    const serviceUUID = req.body.serviceUUID;
 
    // Update data in the services table
    const query = 'UPDATE services SET service_name = ?, service_type = ?, available_times = ? WHERE service_uuid = ?';
    db.query(query, [editServiceName, editServiceType, editAvailableTimes, serviceUUID], (err, results) => {
        if (err) {
            console.error('Error updating service data in MySQL table:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Service data updated successfully');
            res.redirect('/service');
        }
    });
});



// ...

app.post('/service/create', (req, res) => {
    const serviceName = req.body.serviceName;
    const serviceType = req.body.serviceType;
    const availableTimes = req.body.availableTimes;
    const providerId = req.body.providerId;

    // Generate a UUID for the service
    const serviceUUID = generateUUID();

    // Insert data into the services table
    const query = 'INSERT INTO services (service_uuid, service_name, service_type, available_times, provider_id) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [serviceUUID, serviceName, serviceType, availableTimes, providerId], (err, results) => {
      if (err) {
        console.error('Error inserting service data into MySQL table:', err);
        res.status(500).send('Internal Server Error');
      } 
    });
    const filePath = path.join(__dirname, 'createdService.html');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading HTML file:', err);
            res.status(500).send('Internal Server Error');
        } else {
            // Replace the placeholder with the dynamic data
            const modifiedData = data.replace('<%= serviceUUID %>', serviceUUID);

            // Send the modified content as the response
            res.send(modifiedData);
        }
    });
});

app.post('/service/delete', (req, res) => {
    const serviceUUID = req.body.serviceUUID; // Assuming you have a way to identify the service (e.g., UUID)

    // Delete the service from the services table
    const query = 'DELETE FROM services WHERE service_uuid = ?';
    db.query(query, [serviceUUID], (err, results) => {
        if (err) {
            console.error('Error deleting service from MySQL table:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Service deleted successfully');
            // Redirect or send a response as needed
            res.redirect('/service');
        }
    });
});


function generateUUID() {
    return require('uuid').v4();
}

  

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

app.get('/service', (req, res) => {
  res.sendFile(path.join(__dirname, 'manageServices.html'));
});

app.listen(port, () => {
  console.log(`Now listening on port ${port}`);
});
