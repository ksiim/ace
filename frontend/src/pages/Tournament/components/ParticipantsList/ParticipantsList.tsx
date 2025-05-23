import React, { useEffect, useState } from "react";
import { apiRequest } from "../../../../utils/apiRequest.ts";
import styles from "./ParticipantsList.module.scss";
import { Check, Clock } from 'lucide-react';
import { ParticipantsListProps, Fio } from '../../types.ts';

// Расширяем интерфейс Fio, добавляя birth_date
interface ExtendedFio extends Fio {
  birth_date?: string; // Предполагаем, что дата рождения приходит как строка
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
}) => {
  const [userDetails, setUserDetails] = useState<Record<number, ExtendedFio>>({});

  // Функция для форматирования даты в "10 января 2006г."
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  useEffect(() => {
    // Загружаем информацию о пользователях при изменении списка участников
    participants.forEach(participant => {
      // Загружаем данные о пользователе
      if (participant.user_id && !userDetails[participant.user_id]) {
        apiRequest(`users/${participant.user_id}`, "GET", undefined, false)
          .then(response => {
            if (!response.error) {
              setUserDetails(prevDetails => ({
                ...prevDetails,
                [participant.user_id]: {
                  name: response.name,
                  surname: response.surname,
                  patronymic: response.patronymic, // Добавляем отчество
                  birth_date: response.birth_date, // Добавляем дату рождения
                },
              }));
            }
          })
          .catch(error => console.error("Ошибка запроса данных пользователя:", error));
      }

      // Загружаем данные о партнёре, только если partner_id не null
      if (participant.partner_id !== null && !userDetails[participant.partner_id]) {
        apiRequest(`users/${participant.partner_id}`, "GET", undefined, false)
          .then(response => {
            if (!response.error) {
              setUserDetails(prevDetails => ({
                ...prevDetails,
                [participant.partner_id as number]: {
                  name: response.name,
                  surname: response.surname,
                  patronymic: response.patronymic, // Добавляем отчество
                  birth_date: response.birth_date, // Добавляем дату рождения
                },
              }));
            }
          })
          .catch(error => console.error("Ошибка запроса данных партнёра:", error));
      }
    });
  }, [participants, userDetails]);

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
                <div>
                  {userDetails[participant.user_id]?.surname || ''}{' '}
                  {userDetails[participant.user_id]?.name || ''}
                  {userDetails[participant.user_id]?.patronymic && (
                    <> {userDetails[participant.user_id]?.patronymic}</>
                  )}
                  {participant.partner_id !== null && userDetails[participant.partner_id] && (
                    <> / {userDetails[participant.partner_id]?.surname || ''}{' '}
                      {userDetails[participant.partner_id]?.name || ''}
                      {userDetails[participant.partner_id]?.patronymic && (
                        <> {userDetails[participant.partner_id]?.patronymic}</>
                      )}
                    </>
                  )}
                </div>
                <div>
                  {userDetails[participant.user_id]?.birth_date && (
                    <>{formatDate(userDetails[participant.user_id]?.birth_date)}</>
                  )}
                  {participant.partner_id !== null && userDetails[participant.partner_id]?.birth_date && (
                    <> / {formatDate(userDetails[participant.partner_id]?.birth_date)}</>
                  )}
                </div>
              </span>
              {participant.confirmed ? (
                <span className={`${styles.participantStatus} ${styles.confirmed}`}>
                  <Check />
                </span>
              ) : (
                <span className={`${styles.participantStatus} ${styles.confirmed}`}>
                  <Clock color={'#f95e1b'} />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ParticipantsList;