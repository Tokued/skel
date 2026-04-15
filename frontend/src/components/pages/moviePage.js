import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MoviePage = ({ movieId }) => {
    const [recommendations, setRecommendations] = useState([]);

    const fetchRecommendations = async () => {
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=YOUR_API_KEY`);
            setRecommendations(response.data.results);
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, [movieId]);

    return (
        <div>
            {/* Your existing movie page content */}
            <h2>Recommendations</h2>
            <div style={{ display: 'flex', overflowX: 'scroll' }}>
                {recommendations.map(movie => (
                    <div key={movie.id} style={{ margin: '0 10px' }}>
                        <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.title} />
                        <p>{movie.title}</p>
                    </div>
                ))}
            </div>
            {/* Reviews section here */}
        </div>
    );
};

export default MoviePage;
