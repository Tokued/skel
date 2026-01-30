import React, { useState, useEffect } from 'react';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function Routes() {
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await axios('https://api-v3.mbta.com/routes');
        setRoutes(result.data.data);
      } catch (error) {
        console.error("Error fetching routes:", error);
      }
    }
    fetchData();
  }, []);

  const routeTypes = {
    0: 'Train',
    1: 'Subway',
    2: 'Commuter Rail',
    3: 'Bus',
    4: 'Ferry'
  };

  // Map official MBTA lines to their colors
  const lineColors = {
    'Red Line': '#DA291C',
    'Green Line': '#00843D',
    'Blue Line': '#003DA5',
    'Orange Line': '#ED8B00',
    'Silver Line': '#A7A9AC'
  };

  // Extra colors to cycle through for other routes
  const extraColors = ['#0072CE', '#FFC72C', '#6F2DA8', '#E4007F', '#00AEEF'];

  return (
    <Container className="my-5">
      <h1 className="text-center mb-5" style={{ fontWeight: '700', fontSize: '2.5rem' }}>MBTA Lines</h1>
      <Row className="g-4">
        {routes.map((route, index) => {
          const routeName = route.attributes.long_name;

          // Assign color: use official color if in lineColors, else cycle through extraColors
          const color =
            Object.keys(lineColors).find(line => routeName.toLowerCase().includes(line.toLowerCase()))
              ? lineColors[Object.keys(lineColors).find(line => routeName.toLowerCase().includes(line.toLowerCase()))]
              : extraColors[index % extraColors.length];

          return (
            <Col key={route.id} xs={12} sm={6} md={4} lg={3}>
              <Card
                className="h-100 shadow-sm border-0"
                style={{
                  borderRadius: '15px',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                }}
              >
                {/* Colored bar at the top */}
                <div style={{ height: '8px', backgroundColor: color, width: '100%' }}></div>

                <Card.Body className="d-flex flex-column justify-content-between p-4">
                  <Card.Title style={{ fontWeight: '600', fontSize: '1.25rem' }}>{routeName}</Card.Title>
                  <Card.Text>
                    <strong>Mode:</strong> {routeTypes[route.attributes.type]}
                  </Card.Text>
                  <Badge
                    style={{
                      backgroundColor: color,
                      color: 'white',
                      padding: '0.4em 0.75em',
                      borderRadius: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {routeName}
                  </Badge>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
}

export default Routes;
