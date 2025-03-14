import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Schedule.module.scss';
import { apiRequest } from '../../../../utils/apiRequest';

interface Tournament {
  id: number;
  date: string;
  name: string;
  address: string;
  organizer_name_and_contacts: string;
  type: string;
  photo_path: string;
  organizer_requisites: string;
  price: number;
  can_register: boolean;
  prize_fund: number;
  owner_id: number;
  sex_id: number;
  category_id: number;
  region_id: number;
}

const Schedule: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchTournaments = async () => {
      const response = await apiRequest('tournaments/all?skip=0&limit=100', 'GET', undefined, false);
      if (response && response.data) {
        setTournaments(response.data);
      }
    };
    
    fetchTournaments();
  }, []);
  
  const handleRowClick = (tournamentId: number) => {
    navigate(`/tournaments/${tournamentId}`);
  };
  
  return (
    <div className={styles.tableContainer}>
      <table className={styles.Schedule}>
        <thead>
        <tr>
          <th className={styles.dateColumn}>Дата</th>
          <th className={styles.nameColumn}>Название турнира</th>
          <th className={styles.locationColumn}>Место проведения</th>
          <th className={styles.refereeColumn}>Организатор</th>
          <th className={styles.categoryColumn}>Тип</th>
        </tr>
        </thead>
        <tbody>
        {tournaments.map((tournament, index) => (
          <tr
            key={tournament.id}
            onClick={() => handleRowClick(tournament.id)}
            className={`${styles.tournamentRow} ${index % 2 === 1 ? styles.evenRow : ''}`}
          >
            <td>{new Date(tournament.date).toLocaleDateString()}</td>
            <td className={styles.nameCell}>{tournament.name}</td>
            <td>{tournament.address}</td>
            <td>{tournament.organizer_name_and_contacts}</td>
            <td>{tournament.type === "solo" ? "Одиночный" : "Парный"}</td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
};

export default Schedule;
