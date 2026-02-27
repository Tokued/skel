const axios = require('axios');

async function testGetWatchlist() {
    try {
        const userId = "U123";
        const response = await axios.get(`http://localhost:8081/watchlist/${userId}`);

        console.log("Get Watchlist Test Passed. Movies:", response.data);
    } catch (error) {
        if (error.response) {
            console.log("Get Watchlist Test Failed:", error.response.data);
        } else {
            console.error(error);
        }
    }
}

testGetWatchlist();