// Schedule.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Schedule.module.css';

interface Tournament {
  id: string;
  date: string;
  name: string;
  location: string;
  mainReferee: string;
  category: string;
}

const Schedule: React.FC = () => {
  // Встроенные данные о турнирах
  const tournaments: Tournament[] = [
    {
      id: 't001',
      date: '02.02.2025',
      name: 'Красный мяч+',
      location: 'ТК "Аксай"',
      mainReferee: 'Ширяева И.И.',
      category: 'г.р. 2018 и мл.'
    },
    {
      id: 't002',
      date: '09.02.2025',
      name: 'Оранжевый мяч',
      location: 'ТК "Аксай"',
      mainReferee: 'Ширяева И.И.',
      category: 'г.р. 2017 и мл.'
    },
    {
      id: 't003',
      date: '16.02.2025',
      name: 'Зеленый мяч',
      location: 'ТК "Аксай"',
      mainReferee: 'Ширяева И.И.',
      category: 'г.р. 2015 и мл.'
    },
    {
      id: 't004',
      date: '22.02.2025',
      name: 'Блиц-турнир',
      location: 'Донская теннисная академия',
      mainReferee: 'Гигиташвили А.',
      category: 'до 13 лет и мл.'
    },
    {
      id: 't005',
      date: '15.03.2025',
      name: 'Красный мяч',
      location: 'Донская теннисная академия',
      mainReferee: 'Гигиташвили А.',
      category: 'до 10 лет и мл.'
    }
  ];
  
  const navigate = useNavigate();
  
  const handleRowClick = (tournamentId: string) => {
    // Переход на страницу конкретного турнира
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
          <th className={styles.refereeColumn}>Главный судья</th>
          <th className={styles.categoryColumn}>Категория</th>
        </tr>
        </thead>
        <tbody>
        {tournaments.map((tournament, index) => (
          <tr
            key={tournament.id}
            onClick={() => handleRowClick(tournament.id)}
            className={`${styles.tournamentRow} ${index % 2 === 1 ? styles.evenRow : ''}`}
          >
            <td>{tournament.date}</td>
            <td className={styles.nameCell}>{tournament.name}</td>
            <td>{tournament.location}</td>
            <td>{tournament.mainReferee}</td>
            <td>{tournament.category}</td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
};

export default Schedule;