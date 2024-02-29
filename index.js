// Import packages
const pg = require('pg')
const express = require('express')
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_acme_shop_db')
const app = express()

// routes
app.use(express.json());
app.use(require('morgan')('dev'));

// req.params to obtain the id, from the route
// all flavors
app.get('/api/flavors', async (req, res, next) => {
    try{
        const SQL = `SELECT * FROM flavors ORDER BY created_at DESC;`
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (ex){
        next(ex);
    }
});

// single flavor
app.get('/api/flavors:id', async (req, res, next) => {
    try{
        const SQL = `
            SELECT * FROM flavors
            WHERE id = $1
        `
        const response = await client.query(SQL, [req.params.id]);
        res.send(response.rows);
    } catch (ex){
        next(ex);
    }
});

// create a flavor
app.post('/api/flavors', async (req, res, next) => {
    try {
        const SQL = `
            INSERT INTO flavors(name)
            VALUES($1)
            RETURNING *
        `
        const response = await client.query(SQL, [req.body.name])
        res.send(response.rows[0])
    } catch (ex) {
        next(ex)
    }
});

// update a flavor
app.put('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
            UPDATE flavors
            SET name=$1, is_favorite=$2, updated_at= now()
            WHERE id=$3 
            RETURNING *
        `
        const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id])
        res.send(response.rows[0])
    } catch (ex) {
        next(ex)
    }
});

// delete a flavor
// don't need to send data, just a status code that the item was successfully deleted
app.delete('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
            DELETE from flavors
            WHERE id = $1
        `
        const response = await client.query(SQL, [req.params.id])
        res.sendStatus(204)
    } catch (ex) {
        next(ex)
    }
});

// a function to run that connects to our database and create a table
const init = async() => {
    await client.connect();
    console.log('connected to database');
    let SQL = `
        DROP TABLE IF EXISTS flavors;
        CREATE TABLE flavors(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            is_favorite BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        )
    `;
    await client.query(SQL);
    console.log('table created');
    SQL = `
        INSERT INTO flavors (name) VALUES ('Strawberry');
        INSERT INTO flavors (name, is_favorite) VALUES ('Chocolate', true);
        INSERT INTO flavors (name, is_favorite) VALUES ('Pistachio', true);
        INSERT INTO flavors (name) VALUES ('Vanilla');
        INSERT INTO flavors (name) VALUES ('Haselnut');
    `;
    await client.query(SQL);
    console.log('data seeded');

    // to make app listen on a port
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`listening on port ${PORT}`)
    )
};

init();