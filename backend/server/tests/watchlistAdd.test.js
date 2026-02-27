const axios = require('axios');

async function testAddMovie() {
    try {
        const response = await axios.post('http://localhost:8081/watchlist/add', {
            userId: "U123",
            movieId: "M001",
            title: "Inception"
        });

        console.log("Add Movie Test Passed:", response.data);
    } catch (error) {
        if (error.response) {
            console.log("Add Movie Test Failed:", error.response.data);
        } else {
            console.error(error);
        }
    }
}

testAddMovie();