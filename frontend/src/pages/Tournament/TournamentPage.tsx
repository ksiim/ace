import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../../utils/apiRequest.ts';
import styles from './TournamentPage.module.scss';
import Header from '../../components/Header/Header.tsx';

interface TournamentPage {
  id: number;
  name: string;
  type: string;
  is_child: boolean;
  photo: string;
  organizer_name_and_contacts: string;
  organizer_requisites: string;
  date: string;
  price: number;
  can_register: boolean;
  address: string;
  prize_fund: number;
}

const TournamentPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<TournamentPage | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const response = await apiRequest(`tournaments/${tournamentId}`, 'GET');
        if (response) {
          setTournament(response);
        }
      } catch (error) {
        console.error('Ошибка загрузки турнира:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTournament();
  }, [tournamentId]);
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loaderContainer}>
          <div className={styles.loader}></div>
          <p>Загрузка информации о турнире...</p>
        </div>
      );
    }
    
    if (!tournament) {
      return <div className={styles.error}>Турнир не найден</div>;
    }
    
    return (
      <div className={styles.tournamentContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.tournamentInfo}>
            <h1 className={styles.tournamentName}>{tournament.name}</h1>
            <p className={styles.tournamentDate}>
              {new Date(tournament.date).toLocaleDateString()}
            </p>
            <p className={styles.tournamentType}>
              <strong>Тип:</strong> {tournament.type}
            </p>
            <p className={styles.tournamentAddress}>
              <strong>Место проведения:</strong> {tournament.address}
            </p>
            <p className={styles.tournamentOrganizer}>
              <strong>Организатор:</strong> {tournament.organizer_name_and_contacts}
            </p>
            <p className={styles.tournamentRequisites}>
              <strong>Реквизиты:</strong> {tournament.organizer_requisites}
            </p>
            <p className={styles.tournamentPrice}>
              <strong>Стоимость участия:</strong> {tournament.price > 0 ? `${tournament.price} ₽` : 'Бесплатно'}
            </p>
            <p className={styles.tournamentPrizeFund}>
              <strong>Призовой фонд:</strong> {tournament.prize_fund > 0 ? `${tournament.prize_fund} ₽` : 'Не предусмотрен'}
            </p>
            <div className={styles.registrationContainer}>
              {tournament.can_register && (
                <button className={styles.registrationButton}>
                  Регистрация открыта
                </button>
              )}
              {!tournament.can_register && (
                <p className={styles.registrationClosed}>
                  Регистрация закрыта
                </p>
              )}
            </div>
          </div>
          
          {tournament.photo && (
            <div className={styles.imageContainer}>
              <img
                src={tournament.photo}
                alt={tournament.name}
                className={styles.tournamentImage}
              />
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className={styles.pageWrapper}>
      <Header scrollToBenefits={() => {}} />
      <main className={styles.mainContent}>
        {renderContent()}
      </main>
    </div>
  );
};

export default TournamentPage;