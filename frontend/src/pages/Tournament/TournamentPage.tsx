import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../../utils/apiRequest.ts';
import styles from './TournamentPage.module.scss';
import Header from '../../components/Header/Header.tsx';
import ParticipantsList from './components/ParticipantsList/ParticipantsList.tsx';
import type {TournamentPage, User, Sex, Participant} from './types.ts';


const TournamentPage: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [tournament, setTournament] = useState<TournamentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [partnerId, setPartnerId] = useState<string>('');
  const [partnerData, setPartnerData] = useState<User | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sexes, setSexes] = useState<Sex[]>([]);
  
  const loadParticipants = async () => {
    if (!tournament || !userData) return;
    
    try {
      const response = await apiRequest(`tournaments/${tournament.id}/participants`, 'GET', undefined, false);
      if (response && !response.error) {
        setParticipants(response.data);
        
        // Проверяем, зарегистрирован ли текущий пользователь
        const isUserRegistered = response.data.some(
          (participant: Participant) => participant.user_id === userData.id
        );
        setIsRegistered(isUserRegistered);
      }
    } catch (error) {
      console.error('Ошибка при загрузке списка участников:', error);
    }
  };
  
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const response = await apiRequest(`tournaments/${tournamentId}`, 'GET', undefined, false);
        if (response) {
          setTournament(response);
          
          // Загружаем участников сразу после загрузки турнира
          const participantsResponse = await apiRequest(
            `tournaments/${response.id}/participants`,
            'GET',
            undefined,
            true
          );
          if (participantsResponse && !participantsResponse.error) {
            setParticipants(participantsResponse.data);
            
            // Проверяем, зарегистрирован ли текущий пользователь
            if (userData) {
              const isUserRegistered = participantsResponse.data.some(
                (participant: Participant) => participant.user_id === userData.id
              );
              setIsRegistered(isUserRegistered);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки турнира:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchSexes = async () => {
      try {
        const response = await apiRequest('sex/', 'GET', undefined, true);
        if (response && response.data) {
          setSexes(response.data);
        }
      } catch (error) {
        console.error('Ошибка загрузки списка полов:', error);
      }
    };
    
    fetchSexes();
    fetchTournament();
  }, [tournamentId, userData]); // Добавляем userData в зависимости
  
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
        const participantsResponse = await apiRequest(`tournaments/${tournament.id}/participants`, 'GET', undefined, false);
        
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
        
        // Данные для регистрации или обновления
        const registrationData = {
          tournament_id: tournament.id,
          user_id: userData.id,
          partner_id: partnerId ? parseInt(partnerId) : null,
          participant_name: partnerId
            ? `${userData.surname} ${userData.name} ${userData.patronymic}\ ${partnerData?.surname} ${partnerData?.name} ${partnerData?.patronymic}`
            : `${userData.surname} ${userData.name} ${userData.patronymic}`,
        };
        
        if (existingParticipant) {
          // Если участие уже существует, обновляем его, но сохраняем текущее значение confirmed
          const participantId = existingParticipant.id;
          const updateResponse = await apiRequest(
            `participants/${participantId}`,
            'PUT',
            {
              ...registrationData, // Новые данные
              confirmed: existingParticipant.confirmed, // Сохраняем текущее значение confirmed
            },
            true
          );
          
          if (!updateResponse.error) {
            alert('Ваше участие в турнире обновлено!');
            await loadParticipants(); // Перезагружаем список участников
          } else {
            alert('Ошибка при обновлении участия!');
          }
        } else {
          // Если участия нет, создаем новое
          const response = await apiRequest(
            'participants/',
            'POST',
            {
              ...registrationData,
              confirmed: false, // По умолчанию участие не подтверждено
            },
            true
          );
          if (!response.error) {
            alert('Вы успешно зарегистрировались на турнир!');
            await loadParticipants(); // Перезагружаем список участников
          } else {
            alert('Ошибка при регистрации!');
          }
        }
        
        setIsModalOpen(false);
      }
    } catch (error: any) {
      console.error('Ошибка при отправке запроса на регистрацию:', error);
  
      // Проверяем статус ошибки
      if (error.response && error.response.status === 403) {
        // Перенаправляем на страницу /subscription
        window.location.href = '/subscription';
      } else {
        alert('Произошла ошибка при регистрации. Пожалуйста, попробуйте ещё раз.');
      }
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
        const response = await apiRequest(`users/${partnerId}/fio`, 'GET', undefined, false);
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
              <strong>Тип турнира:</strong> {tournament.type === 'solo' ? 'Одиночный' : 'Парный'}
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
              <strong>Стоимость участия (за человека):</strong> {tournament.price > 0 ? `${tournament.price} ₽` : 'Бесплатно'}
            </p>
            <p className={styles.tournamentPrizeFund}>
              <strong>Призовой фонд:</strong> {tournament.prize_fund > 0 ? `${tournament.prize_fund} ₽` : 'Не предусмотрен'}
            </p>
            <p className={styles.tournamentSex}>
              <strong>Пол участников:</strong> {sexes.find(sex => sex.id === tournament.sex_id)?.name || 'Не указан'}
            </p>
            <div className={styles.registrationContainer}>
              {tournament.can_register && (
                <>
                  {tournament.type === 'solo' && isRegistered ? null : (
                    <button
                      className={styles.registrationButton}
                      onClick={handleRegisterClick}
                    >
                      {isRegistered ? 'Обновить участие' : 'Зарегистрироваться'}
                    </button>
                  )}
                </>
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
          participants={participants}
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
