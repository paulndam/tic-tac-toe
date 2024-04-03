const dotenv = require('dotenv');
dotenv.config({ path: '../../.env' }); // Adjust the path as needed, but typically .env is at the root

const development = {
    username: process.env.DATABASE_USERNAME,
    password: null,
    database: 'tic_tac_toe_db',
    host: '127.0.0.1',
    dialect: 'postgres',
    logging: false,
};

module.exports = {
    development,
};