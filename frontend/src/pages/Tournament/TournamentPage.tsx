import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../../utils/apiRequest.ts';
import styles from './TournamentPage.module.scss';
import Header from '../../components/Header/Header.tsx';
import ParticipantsList from './components/ParticipantsList/ParticipantsList.tsx';

interface TournamentPage {
  id: number;
  name: string;
  type: string;
  is_child: boolean;
  photo_path: string;
  organizer_name_and_contacts: string;
  organizer_requisites: string;
  date: string;
  price: number;
  can_register: boolean;
  address: string;
  prize_fund: number;
  owner_id: number;
  sex_id: number;
  category_id: number;
  region_id: number;
}

interface User {
  name: string;
  surname: string;
  patronymic: string;
  admin: boolean;
  organizer: boolean;
  end_of_subscription: string;
  updated_at: string;
  created_at: string;
  phone_number: string;
  email: string;
  id: number;
}

interface Participant {
  id: number;
  confirmed: boolean;
  user_id: number;
  partner_id: number | null;
  participant_name: string;
  tournament_id: number;
}

const TournamentPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<TournamentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [partnerId, setPartnerId] = useState<string>('');
  const [partnerData, setPartnerData] = useState<User | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  const loadParticipants = async () => {
    if (!tournament) return;
    
    try {
      const response = await apiRequest(`tournaments/${tournament.id}/participants`, 'GET', undefined, true);
      if (response && !response.error) {
        setParticipants(response.data);
      }
    } catch (error) {
      console.error('Ошибка при загрузке списка участников:', error);
    }
  };
  
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const response = await apiRequest(`tournaments/${tournamentId}`, 'GET', undefined, true);
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
  
  useEffect(() => {
    if (tournament) {
      loadParticipants();
    }
  }, [tournament]);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiRequest('users/me', 'GET', undefined, true);
        setUserData(response);
      } catch (error) {
        console.error('Ошибка при загрузке данных о пользователе:', error);
      }
    };
    
    fetchUserData();
  }, []);
  
  useEffect(() => {
    if (!tournament) return; // Проверка, что tournament не null
    
    const tournamentDate = new Date(tournament.date);
    const today = new Date();
    
    const diffTime = tournamentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 14 && tournament.can_register) {
      setTournament((prev) => {
        if (!prev) return prev; // Защита от null
        
        return { ...prev, can_register: false } as TournamentPage; // Приведение к нужному типу
      });
    }
  }, [tournament]);
  
  
  
  
  const handleRegisterClick = () => {
    setIsModalOpen(true);
  };
  
  const handleConfirmRegistration = async () => {
    setIsRegistering(true);
    try {
      if (userData && tournament) {
        // Получаем участников турнира
        const participantsResponse = await apiRequest(`tournaments/${tournament.id}/participants`, 'GET', undefined, true);
        
        // Ищем участие текущего пользователя
        const existingParticipant = participantsResponse.data.find(
          (participant: any) => participant.user_id === userData.id
        );
        
        // Проверка, является ли текущий пользователь партнёром кого-либо
        const isAlreadyPartner = participantsResponse.data.some(
          (participant: any) => participant.partner_id === userData.id
        );
        
        if (isAlreadyPartner) {
          alert('Вы уже являетесь партнёром другого участника!');
          return; // Прекращаем дальнейшее выполнение
        }
        
        const registrationData = {
          tournament_id: tournament.id,
          user_id: userData.id,
          confirmed: false,
          partner_id: partnerId ? parseInt(partnerId) : null,
          participant_name: partnerId
            ? `${userData.surname} ${userData.name} ${userData.patronymic}\ ${partnerData?.surname} ${partnerData?.name} ${partnerData?.patronymic}`
            : `${userData.surname} ${userData.name} ${userData.patronymic}`,
        };
        
        if (existingParticipant) {
          // Если участие уже существует, обновляем его
          const participantId = existingParticipant.id;
          const updateResponse = await apiRequest(`participants/${participantId}`, 'PUT', registrationData, true);
          
          if (!updateResponse.error) {
            alert('Ваше участие в турнире обновлено!');
            await loadParticipants(); // Перезагружаем список участников
          } else {
            alert('Ошибка при обновлении участия!');
          }
        } else {
          // Если участия нет, создаем новое
          const response = await apiRequest('participants/', 'POST', registrationData, true);
          if (!response.error) {
            alert('Вы успешно зарегистрировались на турнир!');
            await loadParticipants(); // Перезагружаем список участников
          } else {
            alert('Ошибка при регистрации!');
          }
        }
        
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Ошибка при отправке запроса на регистрацию:', error);
    } finally {
      setIsRegistering(false);
    }
  };
  
  
  const handleCancelRegistration = () => {
    setIsModalOpen(false);
  };
  
  const handlePartnerIdChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const partnerId = event.target.value;
    setPartnerId(partnerId);
    
    // Если партнёр добавлен, получаем его данные
    if (partnerId) {
      try {
        const response = await apiRequest(`users/${partnerId}/fio`, 'GET', undefined, true);
        if (response) {
          setPartnerData(response);
        } else {
          setPartnerData(null); // Если партнёр не найден, сбрасываем данные
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных партнёра:', error);
        setPartnerData(null); // Обнуляем данные при ошибке
      }
    } else {
      setPartnerData(null); // Сбрасываем данные, если поле пустое
    }
  };
  
  
  // Обработчик для подтверждения участника
  const handleParticipantConfirm = async () => {
    try {
      // После успешного подтверждения перезагружаем список
      await loadParticipants();
    } catch (error) {
      console.error('Ошибка при обновлении статуса участника:', error);
    }
  };
  
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
              <strong>Тип турнира:</strong> {tournament.type === "solo" ? "Одиночный" : "Парный"}
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
                <button className={styles.registrationButton} onClick={handleRegisterClick}>
                  Зарегистрироваться
                </button>
              )}
              {!tournament.can_register && (
                <p className={styles.registrationClosed}>Регистрация закрыта</p>
              )}
            </div>
          </div>
          
          {tournament.photo_path && (
            <div className={styles.imageContainer}>
              <img
                src={tournament.photo_path}
                alt={tournament.name}
                className={styles.tournamentImage}
              />
            </div>
          )}
        </div>
        
        <ParticipantsList
          tournamentId={tournament.id}
          participants={participants}
          onParticipantConfirm={handleParticipantConfirm}
        />
      </div>
    );
  };
  
  return (
    <div className={styles.pageWrapper}>
      <Header scrollToBenefits={() => {}} />
      <main className={styles.mainContent}>
        {renderContent()}
        
        {isModalOpen && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Вы хотите записаться на турнир?</h2>
              {tournament?.type === 'duo' && (
                <div className={styles.modalInput}>
                  <label htmlFor="partnerId">ID партнёра:</label>
                  <input
                    type="text"
                    id="partnerId"
                    value={partnerId}
                    onChange={handlePartnerIdChange}
                    placeholder="Введите ID партнёра"
                  />
                  {partnerData && partnerData.surname && partnerData.name && partnerData.patronymic && (
                    <p>Партнёр: {partnerData.surname} {partnerData.name} {partnerData.patronymic}</p>
                  )}
                
                </div>
              )}
              <div className={styles.modalButtons}>
                <button
                  onClick={handleConfirmRegistration}
                  disabled={isRegistering}
                  className={styles.confirmButton}
                >
                  {isRegistering ? 'Регистрируем...' : 'Да'}
                </button>
                <button onClick={handleCancelRegistration} className={styles.cancelButton}>
                  Нет
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TournamentPage;
