import React, { useEffect, useState } from "react";
import { apiRequest } from "../../../../utils/apiRequest.ts";
import styles from "./ParticipantsList.module.scss";

interface User {
  name: string;
  surname: string;
  patronymic: string;
}

interface Participant {
  id: number;
  confirmed: boolean;
  user_id: number;
  partner_id: number | null;
  participant_name?: string;
  tournament_id: number;
}

interface ParticipantsListProps {
  tournamentId: number;
  participants: Participant[];
  onParticipantConfirm?: () => void;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
                                                             tournamentId,
                                                             participants,
                                                             onParticipantConfirm
                                                           }) => {
  const [userDetails, setUserDetails] = useState<Record<number, User>>({});
  const [isAdminOrOrganizer, setIsAdminOrOrganizer] = useState(false);
  
  useEffect(() => {
    apiRequest("users/me", "GET", undefined, true)
      .then(response => {
        if (!response.error) {
          setIsAdminOrOrganizer(response.admin || response.organizer);
        }
      })
      .catch(error => console.error("Ошибка запроса данных пользователя:", error));
  }, []);
  
  useEffect(() => {
    // Загружаем информацию о пользователях при изменении списка участников
    participants.forEach(participant => {
      // Загружаем данные о пользователе
      if (participant.user_id && !userDetails[participant.user_id]) {
        apiRequest(`users/${participant.user_id}/fio`, "GET", undefined, true)
          .then(response => {
            if (!response.error) {
              setUserDetails(prevDetails => ({
                ...prevDetails,
                [participant.user_id]: {
                  name: response.name,
                  surname: response.surname,
                  patronymic: response.patronymic // Добавляем отчество
                },
              }));
            }
          })
          .catch(error => console.error("Ошибка запроса данных пользователя:", error));
      }
      
      // Загружаем данные о партнёре, только если partner_id не null
      if (participant.partner_id !== null && !userDetails[participant.partner_id]) {
        apiRequest(`users/${participant.partner_id}/fio`, "GET", undefined, true)
          .then(response => {
            if (!response.error) {
              setUserDetails(prevDetails => ({
                ...prevDetails,
                [participant.partner_id as number]: {
                  name: response.name,
                  surname: response.surname,
                  patronymic: response.patronymic // Добавляем отчество
                },
              }));
            }
          })
          .catch(error => console.error("Ошибка запроса данных партнёра:", error));
      }
    });
  }, [participants, userDetails]);
  
  const confirmParticipant = (participantId: number) => {
    const participantToUpdate = participants.find(participant => participant.id === participantId);
    if (!participantToUpdate) return;
    
    const updatedParticipant = {
      confirmed: true,
      id: participantToUpdate.id,
      user_id: participantToUpdate.user_id,
      partner_id: participantToUpdate.partner_id,
      tournament_id: tournamentId
    };
    
    apiRequest(`participants/${participantId}`, "PUT", updatedParticipant, true)
      .then(response => {
        if (!response.error) {
          // Сообщаем родительскому компоненту о подтверждении участника
          if (onParticipantConfirm) {
            onParticipantConfirm();
          }
        }
      })
      .catch(error => console.error("Ошибка при подтверждении участника:", error));
  };
  
  return (
    <div className={styles.tournamentParticipants}>
      <h3>Список участников</h3>
      {participants.length === 0 ? (
        <p className={styles.noParticipants}>Пока никто не зарегистрировался</p>
      ) : (
        <ul className={styles.participantList}>
          {participants.map(participant => (
            <li key={participant.id} className={styles.participantItem}>
              <span className={styles.participantName}>
                {userDetails[participant.user_id]?.surname} {userDetails[participant.user_id]?.name}
                {userDetails[participant.user_id]?.patronymic && (
                  <> {userDetails[participant.user_id]?.patronymic}</>
                )}
                {participant.partner_id !== null && userDetails[participant.partner_id] && (
                  <> / {userDetails[participant.partner_id]?.surname} {userDetails[participant.partner_id]?.name}
                    {userDetails[participant.partner_id]?.patronymic && (
                      <> {userDetails[participant.partner_id]?.patronymic}</>
                    )}
                  </>
                )}
              </span>
              {participant.confirmed ? (
                <span className={`${styles.participantStatus} ${styles.confirmed}`}>✅</span>
              ) : (
                isAdminOrOrganizer && (
                  <button className={styles.confirmButton} onClick={() => confirmParticipant(participant.id)}>
                    Подтвердить
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


export default ParticipantsList;
