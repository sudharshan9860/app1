import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Table, 
  Nav, 
  Button, 
  Modal 
} from 'react-bootstrap';
import { AuthContext } from '../components/AuthContext';
import ShootingStars from './ShootingStars';
import axiosInstance from '../api/axiosInstance'; // Make sure this exists
import '../styles/LeaderboardAnimation.css';
import { Trophy } from 'lucide-react';

const LeaderboardPage = () => {
  const { username } = useContext(AuthContext);

  // State for leaderboard data
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('overall');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch leaderboard data on mount
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axiosInstance.get('/leaderboard/');
        if (response.data && response.data.data) {
          setLeaderboard(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    };
    fetchLeaderboard();
  }, []);

  // Render rank badge with styling
  const renderRankBadge = (rank) => {
    let badgeClass = 'rank-badge';
    if (rank <= 3) {
      badgeClass += ` ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'}`;
    }
    return (
      <span className={badgeClass}>
        {rank}
      </span>
    );
  };

  // Show user details modal
  const handleShowDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  // Render leaderboard table
  const renderLeaderboardTable = () => (
    <div className="leaderboard-container p-3">
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Average Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, idx) => (
            <tr 
              key={entry.student_id} 
              className={`leaderboard-entry ${entry.username === username ? 'table-active' : ''}`}
            >
              <td>
                {renderRankBadge(idx + 1)}
                {idx < 3 && (
                  <div className={`top-three-badge ${
                    idx === 0 ? 'gold' : 
                    idx === 1 ? 'silver' : 
                    'bronze'
                  }`}>
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                )}
              </td>
              <td>{entry.username}</td>
              <td>
                <span className="points-shine">{Number(entry.average_score).toFixed(2)}</span>
              </td>
              <td>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={() => handleShowDetails({ ...entry, rank: idx + 1 })}
                >
                  Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  // Render user details modal
  const renderUserDetailsModal = () => {
    if (!selectedUser) return null;

    return (
      <Modal 
        show={showDetailsModal} 
        onHide={() => setShowDetailsModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedUser.username}'s Leaderboard Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Card className="mb-3">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5>
                  Rank: {renderRankBadge(selectedUser.rank)}
                </h5>
                <h5 className="points-shine">
                  Average Score: {Number(selectedUser.average_score).toFixed(2)}
                </h5>
              </div>
            </Card.Header>
            <Card.Body>
              <p>No further breakdown available.</p>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <Container fluid className="leaderboard-page">
      {/* Shooting stars background */}
      <ShootingStars />
      
      {/* Page Title */}
      <Row className="mb-4">
        <Col>
          <h2 className="text-center glow-text">Leaderboard</h2>
        </Col>
      </Row>

      {/* Leaderboard Navigation */}
      <Row className="mb-3">
        <Col>
          <Nav variant="tabs" defaultActiveKey="overall">
            <Nav.Item>
              <Nav.Link 
                eventKey="overall" 
                active={activeTab === 'overall'}
                onClick={() => setActiveTab('overall')}
              >
                Overall
              </Nav.Link>
            </Nav.Item>
            {/* <Nav.Item>
              <Nav.Link 
                eventKey="weekly" 
                active={activeTab === 'weekly'}
                onClick={() => setActiveTab('weekly')}
              >
                Weekly
              </Nav.Link>
            </Nav.Item> */}
          </Nav>
        </Col>
      </Row>

      {/* Leaderboard Table */}
      <Row>
        <Col>
          {renderLeaderboardTable()}
        </Col>
      </Row>

      {/* User Details Modal */}
      {renderUserDetailsModal()}
    </Container>
  );
};

export default LeaderboardPage;